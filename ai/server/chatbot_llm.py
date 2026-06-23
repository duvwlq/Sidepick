"""
chatbot_llm.py — 챗봇 LLM 실호출 + Tool 함수 (Pivot Day 데모용)

chatbot_api.py의 stub `llm_call`을 대체할 실제 구현.
- search_cases(query, category): FAISS v2 유사 사례 검색
- query_stats(category): 카테고리별 통계 조회
- llm_call(message, route): Claude Sonnet 4.5 호출 (RAG + JSON 응답)

격리 원칙: chatbot_api.py는 건드리지 않음. 이 파일만 import해서 주입.

작성: 팀장(오혜림) — 2026-06-24
의존: ANTHROPIC_API_KEY / faiss_index_v2.bin / case_metadata_v2.json
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

import faiss
import numpy as np
from anthropic import Anthropic
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer

load_dotenv()

AI_DIR = Path(__file__).resolve().parents[1]
FAISS_PATH = AI_DIR / "data" / "faiss_index_v2.bin"
METADATA_PATH = AI_DIR / "data" / "case_metadata_v2.json"
FAILURE_PATTERN_PATH = AI_DIR / "data" / "failure_pattern.json"
FAILURE_TIMING_PATH = AI_DIR / "data" / "failure_timing.json"

EMBEDDING_MODEL = "snunlp/KR-SBERT-V40K-klueNLI-augSTS"
LLM_MODEL = "claude-sonnet-4-5"

_index = None
_metadata = None
_embedder = None
_client = None
_failure_pattern = None
_failure_timing = None


def _get_client() -> Anthropic:
    global _client
    if _client is None:
        _client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    return _client


def _get_index():
    global _index
    if _index is None and FAISS_PATH.exists():
        _index = faiss.read_index(str(FAISS_PATH))
    return _index


def _get_metadata() -> dict:
    global _metadata
    if _metadata is None and METADATA_PATH.exists():
        _metadata = json.loads(METADATA_PATH.read_text(encoding="utf-8"))
    return _metadata or {}


def _get_embedder():
    global _embedder
    if _embedder is None:
        _embedder = SentenceTransformer(EMBEDDING_MODEL)
    return _embedder


def _get_failure_pattern() -> dict:
    global _failure_pattern
    if _failure_pattern is None and FAILURE_PATTERN_PATH.exists():
        _failure_pattern = json.loads(FAILURE_PATTERN_PATH.read_text(encoding="utf-8"))
    return _failure_pattern or {}


def _get_failure_timing() -> dict:
    global _failure_timing
    if _failure_timing is None and FAILURE_TIMING_PATH.exists():
        _failure_timing = json.loads(FAILURE_TIMING_PATH.read_text(encoding="utf-8"))
    return _failure_timing or {}


def search_cases(
    query: str, top_k: int = 5, category_slug: str | None = None,
) -> list[dict]:
    """FAISS v2 유사 사례 검색 (Tool 1)."""
    index = _get_index()
    meta = _get_metadata()
    cases = meta.get("cases", [])
    if not index or not cases:
        return []

    embedder = _get_embedder()
    vec = embedder.encode([query], convert_to_numpy=True)
    vec = vec / np.linalg.norm(vec, axis=1, keepdims=True)
    vec = vec.astype("float32")

    fetch_k = top_k * 3 if category_slug else top_k
    scores, indices = index.search(vec, min(fetch_k, len(cases)))

    results: list[dict] = []
    for idx, score in zip(indices[0], scores[0]):
        if idx < 0 or idx >= len(cases):
            continue
        case = cases[idx]
        if category_slug and case.get("category_slug") != category_slug:
            continue
        results.append({
            "case_id": case.get("case_id"),
            "title": case.get("title"),
            "category_slug": case.get("category_slug"),
            "case_type": case.get("case_type"),
            "source": case.get("source"),
            "similarity": float(score),
        })
        if len(results) >= top_k:
            break
    return results


def query_stats(category_slug: str) -> dict:
    """카테고리별 실패 패턴·시점 통계 (Tool 2)."""
    pattern = _get_failure_pattern()
    timing = _get_failure_timing()
    return {
        "category_slug": category_slug,
        "failure_pattern": pattern.get(category_slug, {}),
        "failure_timing": timing.get(category_slug, {}),
    }


def known_case_ids() -> set[str]:
    """출력 가드레일용 — 메타데이터에 있는 case_id 전체."""
    meta = _get_metadata()
    return {c.get("case_id") for c in meta.get("cases", []) if c.get("case_id")}


SYSTEM_PROMPT = """당신은 사이드픽의 챗봇입니다. 부업 실패 분석 서비스 운영 중.

[역할]
- 사용자의 부업 질문에 대해 검색된 실제 사례 데이터만 인용하여 답변합니다.
- 답변은 한국어, 50~200자, 친근한 톤.
- 부업 분야 7개만 답변: online-commerce / content-sns / digital-products / platform-labor / talent-freelance / investment / offline-sidejob.

[중요 안전 규칙]
- 인용한 사례는 반드시 [case_id: blog_002] 형식으로 본문에 표기.
- 검색 결과에 없는 case_id를 만들어내지 마세요. 모르면 모른다고 답하세요.
- 광고·정치·욕설·의료·법률 전문 상담은 거부.
- 횡단 주제(세금·마인드·법률)는 "부업 가이드 페이지를 참고하시는 게 좋아요" 안내.

[출력 형식]
JSON으로만 응답 (다른 설명 X):
{
  "reply": "답변 본문 (50~200자, [case_id] 인용 포함)",
  "cited_case_ids": ["blog_002"],
  "confidence": 0.85
}
"""


def llm_call(
    message: str,
    route: str = "simple_rag",
    category_slug: str | None = None,
) -> dict:
    """챗봇 LLM 호출 — chatbot_api.chatbot_process의 llm_call 인자로 주입."""
    client = _get_client()

    cases = search_cases(message, top_k=5, category_slug=category_slug)
    case_context = "\n".join([
        f"- [case_id: {c['case_id']}] {c['title']} "
        f"(유사도 {c['similarity']:.2f}, {c['case_type']})"
        for c in cases
    ]) or "(검색된 사례 없음)"

    stats_context = ""
    if route == "react" and category_slug:
        stats = query_stats(category_slug)
        stats_context = f"\n\n[통계 데이터]\n{json.dumps(stats, ensure_ascii=False)[:500]}"

    user_prompt = (
        f"사용자 질문: {message}\n"
        f"카테고리: {category_slug or '미지정'}\n"
        f"라우팅: {route}\n\n"
        f"[검색된 사례]\n{case_context}{stats_context}\n\n"
        "위 사례만 인용하여 JSON 형식으로 답변하세요."
    )

    try:
        response = client.messages.create(
            model=LLM_MODEL,
            max_tokens=600,
            temperature=0.2,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_prompt}],
        )
        text = response.content[0].text.strip()

        if "```json" in text:
            text = text.split("```json", 1)[1].split("```", 1)[0].strip()
        elif "```" in text:
            text = text.split("```", 1)[1].split("```", 1)[0].strip()

        result = json.loads(text)
        return {
            "reply": result.get("reply", ""),
            "cited_case_ids": result.get("cited_case_ids", []) or [],
            "confidence": float(result.get("confidence", 0.7)),
            "tokens_in": response.usage.input_tokens,
            "tokens_out": response.usage.output_tokens,
            "model": LLM_MODEL,
            "tool_calls": [
                {"name": "search_cases", "result_count": len(cases)},
                *(
                    [{"name": "query_stats", "category": category_slug}]
                    if stats_context else []
                ),
            ],
        }
    except json.JSONDecodeError as e:
        return {
            "reply": "응답 형식 오류가 생겼어요. 다시 질문해주세요.",
            "cited_case_ids": [],
            "confidence": 0.0,
            "error": f"json_parse:{e}",
        }
    except Exception as e:
        return {
            "reply": "AI 응답 중 오류가 발생했습니다.",
            "cited_case_ids": [],
            "confidence": 0.0,
            "error": f"{type(e).__name__}:{e}",
        }


if __name__ == "__main__":
    print("=== search_cases 테스트 ===")
    for c in search_cases("스마트스토어 시작 어떻게 해야해", top_k=3):
        print(f"  {c['case_id']} | {c['title'][:30]} | sim={c['similarity']:.2f}")

    print("\n=== llm_call 테스트 ===")
    r = llm_call(
        "스마트스토어 시작 어떻게 하나요",
        route="simple_rag", category_slug="online-commerce",
    )
    print(f"  reply: {r.get('reply')}")
    print(f"  cited: {r.get('cited_case_ids')}")
    print(f"  confidence: {r.get('confidence')}")
    print(f"  tokens: in={r.get('tokens_in')} out={r.get('tokens_out')}")
