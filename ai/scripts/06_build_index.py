"""
AI-004 (작업 2): SBERT 임베딩 + FAISS 인덱스 구축 (100건)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

입력: data/failure_cases_100_tagged.csv (17개 컬럼)
출력:
  - recommender/sidepick_index.index (FAISS 인덱스, ~150KB 예상)
  - recommender/sidepick_metadata.pkl (원본 메타데이터 매핑)

사용 모델: jhgan/ko-sroberta-multitask (한국어 특화 SBERT)
인덱스 타입: IndexFlatIP (코사인 유사도, 정규화된 벡터 사용)

기존 코드 재활용:
- recommender/embedding_pipeline.py의 모델 선택, 정규화 로직 차용
- 픽플리 100건 스키마에 맞게 입력/출력 재설계

사용법:
1. pip install sentence-transformers faiss-cpu  (이미 설치되어 있을 것)
2. python scripts/06_build_index.py
3. (테스트) python scripts/06_build_index.py test
"""
import os
import pickle
import sys
from pathlib import Path

import numpy as np
import pandas as pd

# faiss는 import 시간 오래 걸림 → 진행 메시지 먼저
print("📦 라이브러리 로딩 중... (10~30초 소요)")
import faiss
from sentence_transformers import SentenceTransformer

# ═══════════════════════════════════════════════
# 0. 경로 설정 (절대경로)
# ═══════════════════════════════════════════════
ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT_DIR / "data"
RECOMMENDER_DIR = ROOT_DIR / "recommender"

INPUT_PATH = DATA_DIR / "failure_cases_100_tagged.csv"
INDEX_PATH = RECOMMENDER_DIR / "sidepick_index.index"
METADATA_PATH = RECOMMENDER_DIR / "sidepick_metadata.pkl"

MODEL_NAME = "jhgan/ko-sroberta-multitask"


def load_sentence_transformer(model_name: str) -> SentenceTransformer:
    """
    로컬 캐시가 있으면 오프라인으로만 모델을 로드한다.

    운영 환경에서 모델이 이미 캐시된 상태라면 Hugging Face HEAD 재시도 로그를
    남길 이유가 없으므로 local_files_only=True를 먼저 시도한다.
    """
    try:
        print("📦 로컬 캐시 우선 확인 중...")
        return SentenceTransformer(model_name, local_files_only=True)
    except Exception:
        print("🌐 로컬 캐시가 없어 온라인 로딩으로 전환합니다.")
        return SentenceTransformer(model_name)


# ═══════════════════════════════════════════════
# 1. SidePickSimilarityEngine 클래스
# ═══════════════════════════════════════════════
class SidePickSimilarityEngine:
    """
    픽플리 100건 데이터 기반 유사 사례 검색 엔진.

    임베딩 입력: free_text (사용자 자유서술 본문)
    검색 결과 메타: 카테고리, 기간, 투자/수익, 가이드 매칭에 필요한 모든 필드
    """

    # 검색 결과로 반환할 필드 (결과 페이지에서 사용)
    META_FIELDS = [
        "id", "source", "category",
        "duration", "daily_hours",
        "invest_amount", "invest_display",
        "revenue_amount", "revenue_display",
        "has_main_job",
        "failure_reasons", "difficulties",
        "free_text",
        "keywords", "failure_category", "summary", "risk_level",
    ]

    def __init__(self, model_name: str = MODEL_NAME):
        print(f"🤖 SBERT 모델 로딩 중: {model_name}")
        self.model = load_sentence_transformer(model_name)
        self.index = None
        self.data = None  # DataFrame
        self.texts = None  # List[str] - 임베딩 입력

    # ─────────────────────────────────────────
    # 1-A. 데이터 로딩 및 검증
    # ─────────────────────────────────────────
    def load_data(self, csv_path: Path) -> pd.DataFrame:
        """failure_cases_100_tagged.csv 로드 및 검증"""
        if not csv_path.exists():
            raise FileNotFoundError(f"입력 파일 없음: {csv_path}")

        df = pd.read_csv(csv_path, encoding="utf-8-sig")

        # 필수 컬럼 검증
        required = ["id", "category", "free_text", "summary"]
        missing = [c for c in required if c not in df.columns]
        if missing:
            raise ValueError(f"필수 컬럼 누락: {missing}")

        # free_text 너무 짧은 건 제외 (임베딩 품질 저하)
        before = len(df)
        df = df[df["free_text"].fillna("").str.len() >= 10].copy()
        after = len(df)
        if before != after:
            print(f"⚠️  free_text 10자 미만 {before - after}건 제외")

        # NaN 값 안전 처리 — 모든 메타 필드를 문자열로 변환 (pickle 안전)
        for col in self.META_FIELDS:
            if col in df.columns:
                df[col] = df[col].fillna("").astype(str)

        df.reset_index(drop=True, inplace=True)
        self.data = df
        self.texts = df["free_text"].tolist()

        print(f"📊 데이터 로딩 완료: {len(self.data)}건")
        return df

    # ─────────────────────────────────────────
    # 1-B. FAISS 인덱스 구축
    # ─────────────────────────────────────────
    def build_index(self, csv_path: Path = INPUT_PATH, batch_size: int = 32) -> "SidePickSimilarityEngine":
        """100건 데이터로 FAISS 인덱스 생성"""
        print("\n📥 데이터 로딩...")
        self.load_data(csv_path)

        print(f"\n🧮 {len(self.texts)}건 임베딩 생성 중...")
        embeddings = self.model.encode(
            self.texts,
            batch_size=batch_size,
            show_progress_bar=True,
            convert_to_numpy=True,
        )

        # 코사인 유사도용 정규화 (IndexFlatIP는 내적 = 정규화된 벡터의 코사인)
        embeddings = embeddings / np.linalg.norm(embeddings, axis=1, keepdims=True)

        print("\n🔍 FAISS 인덱스 구축 중...")
        dimension = embeddings.shape[1]
        self.index = faiss.IndexFlatIP(dimension)
        self.index.add(embeddings.astype("float32"))

        print(f"✅ 인덱스 구축 완료 (차원: {dimension}, 벡터 수: {self.index.ntotal})")
        return self

    # ─────────────────────────────────────────
    # 1-C. 유사 사례 검색
    # ─────────────────────────────────────────
    def search_similar(
        self,
        query_text: str,
        top_k: int = 5,
        min_similarity: float = 0.35,
        category_filter: str = None,
    ) -> list:
        """
        유사 사례 검색.

        Args:
            query_text: 사용자 입력 본문
            top_k: 반환할 최대 결과 수
            min_similarity: 최소 유사도 임계값 (0~1)
            category_filter: 특정 카테고리만 검색 (예: "투자_재테크")

        Returns:
            list of dict: 검색 결과 (similarity_score 포함)
        """
        if self.index is None or self.data is None:
            raise ValueError("인덱스가 없습니다. build_index() 또는 load_index() 먼저 실행하세요.")

        # 쿼리 임베딩
        query_embedding = self.model.encode([query_text], convert_to_numpy=True)
        query_embedding = query_embedding / np.linalg.norm(query_embedding, axis=1, keepdims=True)

        # 더 많이 가져와서 필터링 (카테고리 필터 시 결과 부족 방지)
        search_k = top_k * 5 if category_filter else top_k * 2
        search_k = min(search_k, self.index.ntotal)

        similarities, indices = self.index.search(
            query_embedding.astype("float32"),
            search_k,
        )

        results = []
        for sim, idx in zip(similarities[0], indices[0]):
            if idx == -1:
                continue
            if sim < min_similarity:
                continue

            row = self.data.iloc[idx]

            # 카테고리 필터
            if category_filter and row.get("category", "") != category_filter:
                continue

            # 메타 필드 추출
            result = {"similarity_score": float(sim)}
            for field in self.META_FIELDS:
                value = row.get(field, "")
                # free_text는 길어서 일부만 (결과 페이지에서 일부만 미리보기)
                if field == "free_text" and isinstance(value, str) and len(value) > 300:
                    result[field] = value[:300] + "..."
                else:
                    result[field] = value

            results.append(result)

            if len(results) >= top_k:
                break

        return results

    # ─────────────────────────────────────────
    # 1-D. 인덱스 저장/로드
    # ─────────────────────────────────────────
    def save_index(self, index_path: Path = INDEX_PATH, metadata_path: Path = METADATA_PATH) -> None:
        if self.index is None or self.data is None:
            raise ValueError("저장할 인덱스가 없습니다.")

        index_path.parent.mkdir(parents=True, exist_ok=True)

        faiss.write_index(self.index, str(index_path))

        with metadata_path.open("wb") as f:
            pickle.dump(self.data, f)

        print(f"\n💾 저장 완료:")
        print(f"   - {index_path} ({index_path.stat().st_size / 1024:.1f} KB)")
        print(f"   - {metadata_path} ({metadata_path.stat().st_size / 1024:.1f} KB)")

    def load_index(self, index_path: Path = INDEX_PATH, metadata_path: Path = METADATA_PATH) -> "SidePickSimilarityEngine":
        self.index = faiss.read_index(str(index_path))
        with metadata_path.open("rb") as f:
            self.data = pickle.load(f)
        self.texts = self.data["free_text"].tolist()
        print(f"📂 인덱스 로드 완료 ({self.index.ntotal}건)")
        return self


# ═══════════════════════════════════════════════
# 2. 메인 실행 — 인덱스 빌드 또는 테스트
# ═══════════════════════════════════════════════
def main_build():
    """인덱스 구축"""
    print("=" * 70)
    print("🚀 SBERT + FAISS 인덱스 구축 시작")
    print(f"   입력: {INPUT_PATH.name}")
    print(f"   모델: {MODEL_NAME}")
    print(f"   출력: {INDEX_PATH.name} + {METADATA_PATH.name}")
    print("=" * 70)

    engine = SidePickSimilarityEngine()
    engine.build_index(INPUT_PATH)
    engine.save_index()

    print("\n" + "=" * 70)
    print("✅ 인덱스 구축 완료")
    print("=" * 70)


def main_test():
    """저장된 인덱스로 검색 테스트 — 발표 데모 시나리오 검증"""
    print("=" * 70)
    print("🧪 인덱스 검색 테스트")
    print("=" * 70)

    engine = SidePickSimilarityEngine()
    engine.load_index()

    test_queries = [
        "스마트스토어 시작했는데 광고비만 날리고 매출이 안 나와요",
        "유튜브 6개월 했는데 구독자가 안 늘어서 그만뒀습니다",
        "주식 투자했다가 원금 반토막 났어요",
        "쿠팡이츠 배달 했는데 시급이 너무 낮아서 그만뒀어요",
    ]

    for query in test_queries:
        print(f"\n{'─' * 70}")
        print(f"🔎 쿼리: {query}")
        print(f"{'─' * 70}")

        results = engine.search_similar(query, top_k=3, min_similarity=0.35)

        if not results:
            print("   (유사 사례 없음 — 임계값 낮춰보세요)")
            continue

        for i, r in enumerate(results, 1):
            print(f"\n[{i}] 유사도: {r['similarity_score']:.3f}")
            print(f"   카테고리: {r['category']}")
            print(f"   요약: {r['summary']}")
            print(f"   실패분류: {r['failure_category']} / 위험도: {r['risk_level']}")
            print(f"   본문: {r['free_text'][:150]}...")


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "test":
        main_test()
    else:
        main_build()
