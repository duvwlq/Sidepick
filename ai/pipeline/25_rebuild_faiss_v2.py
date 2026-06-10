"""
25_rebuild_faiss_v2.py — clean_cases + 픽플리 100 기반 FAISS 인덱스 v2 재구축 (AI-19-v2)

입력:
- ai/data/clean_cases.csv (36건, AI-19 재라벨링 후 정제)
- ai/data/pickply_100.csv (100건 픽플리 실패)

출력:
- ai/data/faiss_index_v2.bin (FAISS IndexFlatIP)
- ai/data/case_metadata_v2.json (case_id ↔ vector index 매핑 + 메타)

임베딩: SBERT KR-SBERT-V40K-klueNLI-augSTS
유사도: 코사인 (정규화 후 IP)

작성: 팀장(오혜림) — 2026-06-10
"""

from __future__ import annotations

import csv
import json
import sys
import time
from datetime import datetime, timezone, timedelta
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
CLEAN_PATH = REPO_ROOT / "ai" / "data" / "clean_cases.csv"
PICKPLY_PATH = REPO_ROOT / "ai" / "data" / "pickply_100.csv"
INDEX_PATH = REPO_ROOT / "ai" / "data" / "faiss_index_v2.bin"
META_PATH = REPO_ROOT / "ai" / "data" / "case_metadata_v2.json"

MODEL_NAME = "snunlp/KR-SBERT-V40K-klueNLI-augSTS"
KST = timezone(timedelta(hours=9))


def load_clean_cases() -> list[dict]:
    rows: list[dict] = []
    if not CLEAN_PATH.exists():
        print(f"⚠️ {CLEAN_PATH} 없음 (skip)")
        return rows
    with CLEAN_PATH.open(encoding="utf-8-sig") as f:
        for r in csv.DictReader(f):
            rows.append({
                "case_id": r["case_id"],
                "case_type": r.get("case_type", "success_story"),
                "category_slug": r.get("category_slug", "etc"),
                "source": r.get("source", "naver"),
                "title": r.get("title", ""),
                "text": r.get("full_text", "")[:3000],
                "origin": "clean_cases",
            })
    return rows


def load_pickply() -> list[dict]:
    rows: list[dict] = []
    if not PICKPLY_PATH.exists():
        print(f"⚠️ {PICKPLY_PATH} 없음 (skip)")
        return rows

    # PM-03 v1.6 한글 → slug 매핑
    SLUG_MAP = {
        "온라인판매_이커머스": "online-commerce",
        "콘텐츠_SNS": "content-sns",
        "디지털상품_지식판매": "digital-products",
        "플랫폼노동": "platform-labor",
        "재능_프리랜서": "talent-freelance",
        "투자_재테크": "investment",
        "오프라인부업": "offline-sidejob",
        "기타": "etc",
    }
    with PICKPLY_PATH.open(encoding="utf-8-sig") as f:
        for r in csv.DictReader(f):
            text = " / ".join([
                r.get("free_text", ""),
                f"실패원인: {r.get('failure_reasons', '')}",
                f"어려움: {r.get('difficulties', '')}",
            ])
            rows.append({
                "case_id": f"pickply_{r['id']}",
                "case_type": "failure_story",
                "category_slug": SLUG_MAP.get(r.get("category", "기타"), "etc"),
                "source": "pickply",
                "title": r.get("free_text", "")[:40],
                "text": text[:3000],
                "origin": "pickply_100",
            })
    return rows


def build_index(cases: list[dict]) -> dict:
    try:
        import numpy as np
        import faiss
        from sentence_transformers import SentenceTransformer
    except ImportError as e:
        print(f"❌ 의존성 미설치: {e}")
        print("   ai/venv/bin/pip install sentence-transformers faiss-cpu numpy")
        sys.exit(1)

    print(f"📦 SBERT 모델 로드: {MODEL_NAME}")
    t0 = time.time()
    model = SentenceTransformer(MODEL_NAME)
    print(f"   loaded in {time.time() - t0:.1f}s")

    texts = [c["text"] for c in cases]
    print(f"🔢 {len(texts)}건 임베딩 중...")
    t0 = time.time()
    vectors = model.encode(texts, show_progress_bar=True, convert_to_numpy=True)
    print(f"   encoded in {time.time() - t0:.1f}s / shape={vectors.shape}")

    # 정규화 (코사인 유사도 = 정규화 후 inner product)
    norms = np.linalg.norm(vectors, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    vectors = (vectors / norms).astype("float32")

    index = faiss.IndexFlatIP(vectors.shape[1])
    index.add(vectors)
    print(f"📊 FAISS 인덱스 구축 완료 (dim={vectors.shape[1]}, n={index.ntotal})")

    faiss.write_index(index, str(INDEX_PATH))
    print(f"✅ {INDEX_PATH}")

    metadata = {
        "version": "v2",
        "generated_at": datetime.now(KST).isoformat(timespec="seconds"),
        "model": MODEL_NAME,
        "dimension": int(vectors.shape[1]),
        "total_cases": int(index.ntotal),
        "by_origin": {
            "clean_cases": sum(1 for c in cases if c["origin"] == "clean_cases"),
            "pickply_100": sum(1 for c in cases if c["origin"] == "pickply_100"),
        },
        "by_case_type": {
            "success_story": sum(1 for c in cases if c["case_type"] == "success_story"),
            "failure_story": sum(1 for c in cases if c["case_type"] == "failure_story"),
        },
        "cases": [
            {
                "vector_index": i,
                "case_id": c["case_id"],
                "case_type": c["case_type"],
                "category_slug": c["category_slug"],
                "source": c["source"],
                "title": c["title"],
                "origin": c["origin"],
            }
            for i, c in enumerate(cases)
        ],
    }
    META_PATH.write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"✅ {META_PATH}")

    return metadata


def main() -> None:
    cases = load_clean_cases() + load_pickply()
    if not cases:
        print("❌ 데이터 없음")
        sys.exit(1)
    print(f"\n📥 총 {len(cases)}건 로드")
    print(f"   clean_cases: {sum(1 for c in cases if c['origin'] == 'clean_cases')}")
    print(f"   pickply_100: {sum(1 for c in cases if c['origin'] == 'pickply_100')}")

    meta = build_index(cases)
    print(f"\n📊 case_type 분포: {meta['by_case_type']}")


if __name__ == "__main__":
    main()
