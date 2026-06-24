from __future__ import annotations

import json
import os
import re
from pathlib import Path
from typing import Any

try:
    import faiss
except ImportError:  # pragma: no cover - environment dependent
    faiss = None

try:
    import numpy as np
except ImportError:  # pragma: no cover - environment dependent
    np = None  # type: ignore[assignment]

try:
    from anthropic import Anthropic
except ImportError:  # pragma: no cover - environment dependent
    Anthropic = None  # type: ignore[assignment]

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover - environment dependent
    def load_dotenv() -> bool:
        return False

try:
    from sentence_transformers import SentenceTransformer
except ImportError:  # pragma: no cover - environment dependent
    SentenceTransformer = None  # type: ignore[assignment]

load_dotenv()

AI_DIR = Path(__file__).resolve().parents[1]
FAISS_PATH = AI_DIR / "data" / "faiss_index_v2.bin"
METADATA_PATH = AI_DIR / "data" / "case_metadata_v2.json"
FAILURE_PATTERN_PATH = AI_DIR / "data" / "failure_pattern.json"
FAILURE_TIMING_PATH = AI_DIR / "data" / "failure_timing.json"

EMBEDDING_MODEL = "snunlp/KR-SBERT-V40K-klueNLI-augSTS"
LLM_MODEL = "claude-sonnet-4-5"
GUIDE_REDIRECT_REPLY = (
    "원하시는 방향은 이해했어요. 현재 상황, 쓸 수 있는 시간, 예산, 관심 분야를 "
    "두세 문장만 더 적어주시면 더 정확하게 안내해드릴게요."
)

_index = None
_metadata = None
_embedder = None
_client = None
_failure_pattern = None
_failure_timing = None


def _get_client() -> Anthropic:
    global _client
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY is not configured")
    if Anthropic is None:
        raise RuntimeError("anthropic package is not installed")
    if _client is None:
        _client = Anthropic(api_key=api_key)
    return _client


def _get_index():
    global _index
    if faiss is None:
        return None
    if _index is None and FAISS_PATH.exists():
        _index = faiss.read_index(str(FAISS_PATH))
    return _index


def _get_metadata() -> dict[str, Any]:
    global _metadata
    if _metadata is None and METADATA_PATH.exists():
        _metadata = json.loads(METADATA_PATH.read_text(encoding="utf-8"))
    return _metadata or {}


def _get_embedder():
    global _embedder
    if SentenceTransformer is None:
        raise RuntimeError("sentence-transformers package is not installed")
    if _embedder is None:
        _embedder = SentenceTransformer(EMBEDDING_MODEL, local_files_only=True)
    return _embedder


def _get_failure_pattern() -> dict[str, Any]:
    global _failure_pattern
    if _failure_pattern is None and FAILURE_PATTERN_PATH.exists():
        _failure_pattern = json.loads(FAILURE_PATTERN_PATH.read_text(encoding="utf-8"))
    return _failure_pattern or {}


def _get_failure_timing() -> dict[str, Any]:
    global _failure_timing
    if _failure_timing is None and FAILURE_TIMING_PATH.exists():
        _failure_timing = json.loads(FAILURE_TIMING_PATH.read_text(encoding="utf-8"))
    return _failure_timing or {}


def _tokenize(text: str) -> list[str]:
    return [token for token in re.split(r"\W+", text.lower()) if len(token) >= 2]


def _lexical_search_cases(
    query: str,
    cases: list[dict[str, Any]],
    *,
    top_k: int,
    category_slug: str | None,
) -> list[dict[str, Any]]:
    query_tokens = set(_tokenize(query))
    if not query_tokens:
        return []

    scored: list[tuple[float, dict[str, Any]]] = []
    for case in cases:
        if category_slug and case.get("category_slug") != category_slug:
            continue
        title = str(case.get("title") or "")
        title_tokens = set(_tokenize(title))
        if not title_tokens:
            continue
        overlap = len(query_tokens & title_tokens)
        if overlap == 0:
            continue
        score = overlap / len(query_tokens | title_tokens)
        scored.append((score, case))

    scored.sort(key=lambda item: item[0], reverse=True)
    return [
        {
            "case_id": case.get("case_id"),
            "title": case.get("title"),
            "category_slug": case.get("category_slug"),
            "case_type": case.get("case_type"),
            "source": case.get("source"),
            "similarity": float(score),
        }
        for score, case in scored[:top_k]
    ]


def search_cases(query: str, top_k: int = 5, category_slug: str | None = None) -> list[dict[str, Any]]:
    index = _get_index()
    metadata = _get_metadata()
    cases = metadata.get("cases", [])
    if not cases:
        return []
    if not index or np is None or SentenceTransformer is None:
        return _lexical_search_cases(query, cases, top_k=top_k, category_slug=category_slug)

    vector = _get_embedder().encode([query], convert_to_numpy=True)
    norm = np.linalg.norm(vector, axis=1, keepdims=True)
    norm[norm == 0] = 1.0
    vector = (vector / norm).astype("float32")

    fetch_k = top_k * 3 if category_slug else top_k
    scores, indices = index.search(vector, min(fetch_k, len(cases)))

    results: list[dict[str, Any]] = []
    for idx, score in zip(indices[0], scores[0]):
        if idx < 0 or idx >= len(cases):
            continue
        case = cases[idx]
        if category_slug and case.get("category_slug") != category_slug:
            continue
        results.append(
            {
                "case_id": case.get("case_id"),
                "title": case.get("title"),
                "category_slug": case.get("category_slug"),
                "case_type": case.get("case_type"),
                "source": case.get("source"),
                "similarity": float(score),
            }
        )
        if len(results) >= top_k:
            break
    return results


def query_stats(category_slug: str) -> dict[str, Any]:
    return {
        "category_slug": category_slug,
        "failure_pattern": _get_failure_pattern().get(category_slug, {}),
        "failure_timing": _get_failure_timing().get(category_slug, {}),
    }


def known_case_ids() -> set[str]:
    metadata = _get_metadata()
    return {case.get("case_id") for case in metadata.get("cases", []) if case.get("case_id")}


SYSTEM_PROMPT = """당신은 사이드픽의 챗봇입니다. 부업 실패 분석 서비스 운영 중입니다.

[역할]
- 사용자의 부업 질문에 대해 검색된 실제 사례 데이터만 인용하여 답변합니다.
- 답변은 한국어, 50~200자, 친근한 톤입니다.
- 검색 결과에 없는 case_id를 만들어내지 않습니다.

[출력 형식]
JSON으로만 응답하세요:
{
  "reply": "답변 본문",
  "cited_case_ids": ["blog_002"],
  "confidence": 0.85
}
"""


def _format_success(
    *,
    reply: str,
    cited_case_ids: list[str],
    confidence: float,
    model: str | None,
    tokens_in: int | None,
    tokens_out: int | None,
    tool_calls: list[dict[str, Any]],
) -> dict[str, Any]:
    return {
        "status": "ok",
        "reply": reply,
        "cited_case_ids": cited_case_ids,
        "confidence": confidence,
        "model": model,
        "tokens_in": tokens_in,
        "tokens_out": tokens_out,
        "tool_calls": tool_calls,
    }


def _format_guide_redirect(
    reply: str = GUIDE_REDIRECT_REPLY,
    *,
    tool_calls: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    return {
        "status": "ok",
        "reply": reply,
        "cited_case_ids": [],
        "confidence": 0.35,
        "model": LLM_MODEL,
        "tokens_in": None,
        "tokens_out": None,
        "tool_calls": tool_calls or [],
    }


def _format_fallback(
    reply: str,
    *,
    error: str,
    tool_calls: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    return {
        "status": "fallback",
        "reply": reply,
        "cited_case_ids": [],
        "confidence": 0.0,
        "error": error,
        "tool_calls": tool_calls or [],
        "model": LLM_MODEL,
    }


def llm_call(
    message: str,
    route: str = "simple_rag",
    category_slug: str | None = None,
) -> dict[str, Any]:
    if route == "guide_redirect":
        return _format_guide_redirect(
            tool_calls=[{"name": "search_cases", "result_count": 0, "skipped": True}]
        )

    try:
        cases = search_cases(message, top_k=5, category_slug=category_slug)
    except Exception as exc:
        return _format_fallback(
            "지금은 검색 모델을 불러오지 못했어요. 잠시 후 다시 시도해주세요.",
            error=f"search_error:{type(exc).__name__}:{exc}",
            tool_calls=[{"name": "search_cases", "result_count": 0}],
        )

    tool_calls: list[dict[str, Any]] = [{"name": "search_cases", "result_count": len(cases)}]
    if not cases:
        if route == "simple_rag":
            return _format_guide_redirect(tool_calls=tool_calls)
        return _format_fallback(
            "아직 참고할 사례가 부족해서 바로 답하기 어려워요. 질문을 더 구체적으로 적어주시거나 잠시 후 다시 시도해주세요.",
            error="no_search_results",
            tool_calls=tool_calls,
        )

    stats_context = ""
    if route == "react" and category_slug:
        stats = query_stats(category_slug)
        stats_context = f"\n\n[통계 데이터]\n{json.dumps(stats, ensure_ascii=False)[:500]}"
        tool_calls.append({"name": "query_stats", "category": category_slug})

    case_context = "\n".join(
        f"- [case_id: {case['case_id']}] {case['title']} (유사도 {case['similarity']:.2f}, {case['case_type']})"
        for case in cases
    )
    user_prompt = (
        f"사용자 질문: {message}\n"
        f"카테고리: {category_slug or '미지정'}\n"
        f"라우팅: {route}\n\n"
        f"[검색된 사례]\n{case_context}{stats_context}\n\n"
        "위 사례만 인용하여 JSON 형식으로 답변하세요."
    )

    try:
        response = _get_client().messages.create(
            model=LLM_MODEL,
            max_tokens=600,
            temperature=0.2,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_prompt}],
        )
    except Exception as exc:
        return _format_fallback(
            "지금은 AI 응답 연결이 불안정해요. 잠시 후 다시 시도해주세요.",
            error=f"upstream_error:{type(exc).__name__}:{exc}",
            tool_calls=tool_calls,
        )

    text = response.content[0].text.strip()
    if "```json" in text:
        text = text.split("```json", 1)[1].split("```", 1)[0].strip()
    elif "```" in text:
        text = text.split("```", 1)[1].split("```", 1)[0].strip()

    try:
        result = json.loads(text)
    except json.JSONDecodeError as exc:
        return _format_fallback(
            "응답 형식 오류가 생겼어요. 다시 질문해주세요.",
            error=f"json_parse:{exc}",
            tool_calls=tool_calls,
        )

    return _format_success(
        reply=result.get("reply", ""),
        cited_case_ids=result.get("cited_case_ids", []) or [],
        confidence=float(result.get("confidence", 0.7)),
        model=LLM_MODEL,
        tokens_in=getattr(response.usage, "input_tokens", None),
        tokens_out=getattr(response.usage, "output_tokens", None),
        tool_calls=tool_calls,
    )
