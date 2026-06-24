"""
30_build_faq_faiss.py — FAQ 데이터(faqData.ts) → FAISS 인덱스 통합 (Pivot Day D-1)

목적: 챗봇 RAG가 사용자 작성 사례 + 부업 가이드 페이지(FAQ) 둘 다 검색하도록.

처리 흐름:
1. fe/src/pages/faqData.ts 정규식 파싱 → 248 Q&A 추출
2. category slug + question + answer 결합 → SBERT 임베딩
3. 기존 faiss_index_v2.bin + case_metadata_v2.json 에 FAQ 항목 추가
   - 별도 인덱스 파일: faiss_index_v2_with_faq.bin
   - 별도 메타데이터: case_metadata_v2_with_faq.json
4. case_id 네임스페이스: 'faq_<category>_<id>' (사례 case_id와 충돌 방지)

작성: 팀장(오혜림) — 2026-06-25 (Pivot Day D-1)
의존: faqData.ts / sentence-transformers / faiss-cpu
"""

from __future__ import annotations

import json
import re
from pathlib import Path

import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

REPO_ROOT = Path(__file__).resolve().parents[2]
FAQ_TS_PATH = REPO_ROOT / "fe" / "src" / "pages" / "faqData.ts"
EXISTING_INDEX_PATH = REPO_ROOT / "ai" / "data" / "faiss_index_v2.bin"
EXISTING_METADATA_PATH = REPO_ROOT / "ai" / "data" / "case_metadata_v2.json"
OUTPUT_INDEX_PATH = REPO_ROOT / "ai" / "data" / "faiss_index_v2_with_faq.bin"
OUTPUT_METADATA_PATH = REPO_ROOT / "ai" / "data" / "case_metadata_v2_with_faq.json"

EMBEDDING_MODEL = "snunlp/KR-SBERT-V40K-klueNLI-augSTS"

# faqData.ts category id → 챗봇 카테고리 slug 매핑
# (faqData.ts에는 16개 카테고리: 부업 7 + 횡단 9)
FAQ_CATEGORY_SLUG_MAP = {
    "online-commerce": "online-commerce",
    "content-sns": "content-sns",
    "digital-knowledge": "digital-products",      # FAQ → 챗봇 slug 정합
    "platform-labor": "platform-labor",
    "talent-freelance": "talent-freelance",
    "investment": "investment",
    "offline-sidejob": "offline-sidejob",
    # 횡단 9개는 별도 처리 (cross_topic)
    "before-start": "before-start",
    "tax-business": "tax-business",
    "work-plus-sidejob": "work-plus-sidejob",
    "marketing": "marketing",
    "tools": "tools",
    "mental-care": "mental-care",
    "legal-contract": "legal-contract",
    "accounting": "accounting",
    "insight": "insight",
}


def parse_faq_ts(path: Path) -> list[dict]:
    """faqData.ts 파일에서 카테고리 + Q&A 추출."""
    text = path.read_text(encoding="utf-8")

    results: list[dict] = []
    # 각 카테고리 블록 찾기: { id: 'slug', label: '...', items: [...] }
    category_pattern = re.compile(
        r"\{\s*id:\s*['\"]([^'\"]+)['\"]\s*,\s*label:\s*['\"]([^'\"]+)['\"]\s*,\s*items:\s*\[(.*?)\]\s*,?\s*\}",
        re.DOTALL,
    )
    item_pattern = re.compile(
        r"\{\s*id:\s*(\d+)\s*,\s*question:\s*['\"]([^'\"]+(?:[^'\"]|\\['\"])*?)['\"]\s*,"
        r"\s*answer:\s*\n?\s*['\"]([^'\"]+(?:[^'\"]|\\['\"])*?)['\"]\s*,?\s*\}",
        re.DOTALL,
    )

    for cat_match in category_pattern.finditer(text):
        cat_id, cat_label, items_block = cat_match.groups()
        for item_match in item_pattern.finditer(items_block):
            item_id, question, answer = item_match.groups()
            answer_clean = answer.replace("\\'", "'").replace('\\"', '"').strip()
            results.append({
                "faq_category_id": cat_id,
                "faq_category_label": cat_label,
                "faq_item_id": int(item_id),
                "question": question.strip(),
                "answer": answer_clean,
            })
    return results


def build_combined_index(faq_items: list[dict]) -> None:
    """기존 FAISS 인덱스 + FAQ 항목 결합 → 새 인덱스·메타데이터 생성."""
    print(f"📂 기존 인덱스 로드: {EXISTING_INDEX_PATH.name}")
    existing_index = faiss.read_index(str(EXISTING_INDEX_PATH))
    existing_meta = json.loads(EXISTING_METADATA_PATH.read_text(encoding="utf-8"))
    existing_cases = existing_meta.get("cases", [])
    print(f"   기존 사례: {len(existing_cases)}건 / 인덱스 차원: {existing_index.d}")

    print(f"\n📝 FAQ 임베딩 생성 중... ({len(faq_items)}건)")
    model = SentenceTransformer(EMBEDDING_MODEL)
    faq_texts = [f"{item['question']} {item['answer'][:300]}" for item in faq_items]
    faq_embeddings = model.encode(faq_texts, batch_size=32, show_progress_bar=True, convert_to_numpy=True)
    faq_embeddings = faq_embeddings / np.linalg.norm(faq_embeddings, axis=1, keepdims=True)
    faq_embeddings = faq_embeddings.astype("float32")
    print(f"   임베딩 차원: {faq_embeddings.shape}")

    print("\n🔗 인덱스 결합 중...")
    new_index = faiss.IndexFlatIP(existing_index.d)
    # 기존 벡터 복원
    existing_vectors = existing_index.reconstruct_n(0, existing_index.ntotal)
    new_index.add(existing_vectors)
    # FAQ 벡터 추가
    new_index.add(faq_embeddings)

    # 메타데이터 결합
    combined_cases = list(existing_cases)
    base_vector_idx = existing_index.ntotal
    for i, faq in enumerate(faq_items):
        slug = FAQ_CATEGORY_SLUG_MAP.get(faq["faq_category_id"], faq["faq_category_id"])
        combined_cases.append({
            "vector_index": base_vector_idx + i,
            "case_id": f"faq_{faq['faq_category_id']}_{faq['faq_item_id']}",
            "case_type": "faq",
            "category_slug": slug,
            "source": "faq",
            "title": faq["question"],
            "answer": faq["answer"],
            "origin": "guide_page",
        })

    output_meta = {
        **existing_meta,
        "version": "v2_with_faq",
        "generated_at": "2026-06-25",
        "total_cases": len(combined_cases),
        "faq_count": len(faq_items),
        "case_count": len(existing_cases),
        "cases": combined_cases,
    }

    OUTPUT_INDEX_PATH.parent.mkdir(parents=True, exist_ok=True)
    faiss.write_index(new_index, str(OUTPUT_INDEX_PATH))
    OUTPUT_METADATA_PATH.write_text(
        json.dumps(output_meta, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"\n✅ 저장 완료:")
    print(f"   {OUTPUT_INDEX_PATH.name}: {new_index.ntotal}개 벡터")
    print(f"   {OUTPUT_METADATA_PATH.name}: 사례 {len(existing_cases)} + FAQ {len(faq_items)} = {len(combined_cases)}건")


def main() -> None:
    print("=" * 60)
    print("FAQ → FAISS 통합 빌드 (Pivot Day D-1)")
    print("=" * 60)

    print(f"\n📄 faqData.ts 파싱 중: {FAQ_TS_PATH}")
    faq_items = parse_faq_ts(FAQ_TS_PATH)
    print(f"   추출된 Q&A: {len(faq_items)}건")
    if faq_items:
        print(f"   샘플: [{faq_items[0]['faq_category_id']}] {faq_items[0]['question'][:40]}...")

    if not faq_items:
        print("❌ FAQ 추출 실패. 정규식 또는 파일 경로 확인 필요.")
        return

    build_combined_index(faq_items)
    print("\n=== 완료 ===")


if __name__ == "__main__":
    main()
