# pipeline/ — 데이터 수집·정제 파이프라인

AI-A가 작성한 네이버 지식iN 실패 사례 수집 파이프라인의 정리본 (yumenikkidiary 레포 기준 최신).

## 🔄 7단계 흐름 (실패 사례 — MVP)

```
01_collect_naver_kin.py        네이버 지식iN API로 후보 수집 (약 1,000개)
        ↓
02_clean_text.py                요약문 기반 1차 텍스트 클렌징
        ↓
03_select_top1000.py            상위 1,000개 후보 선별
        ↓
04_filter_failures.py           키워드 점수 기반 1차 실패 사례 필터링
        ↓
05_expand_fulltext.py           ⭐ 본문 직접 크롤링 (description → full_text)
        ↓
06_clean_fulltext.py            본문 텍스트 추가 클렌징
        ↓
07_filter_failures_final.py    본문 기반 최종 실패 사례 필터링 (49건 도출)
```

## ➕ 고도화: 성공 사례 (AI-01, 2026-05-19 추가)

```
08_collect_success_cases.py    성공 키워드 + 카테고리 자동 태깅 (1주차 목표 50건)
        ↓  (2주차)
        실패 파이프라인과 동일하게 정제 → AI 분석글 입력 데이터셋
```

- 출력: `ai/data/success_kin_candidates.csv` / `_strict.csv` / `_review.csv`
- 광고 필터링은 01번 패턴 재사용 + 강의/코치 광고 키워드 추가
- 7개 부업 카테고리 자동 태깅 (`category` 컬럼)

## 📊 단계별 데이터 변화

| 단계 | 입력 | 출력 | 누적 결과 |
|---|---|---|---|
| 01 | (네이버 API) | `naver_kin_candidates.csv` | ~18,447건 |
| 02 | 후보 csv | 클렌징된 csv | 18,447건 (필드 정리) |
| 03 | 클렌징본 | top 1000 | 1,000건 |
| 04 | top 1000 | 1차 실패 필터 | 9,040건 또는 strict |
| 05 | 1차 필터본 | full_text 포함 csv | ~278건 (본문 확장) |
| 06 | full_text csv | 본문 클렌징본 | ~238건 (질문 본문만) |
| 07 | 본문 클렌징본 | **`failure_cases_49.csv`** | **49건 + 검수 20건** |

## 🚀 실행 방법

각 스크립트는 독립 실행 가능. 단, **순서대로 실행**해야 함 (이전 단계의 출력이 다음 입력).

```bash
cd ~/Sidepick/ai
source venv/bin/activate

python pipeline/01_collect_naver_kin.py
python pipeline/02_clean_text.py
# ... 이런 식으로 7단계까지
```

## ⚠️ 의존성

각 스크립트가 사용하는 라이브러리는 yumenikkidiary 원본 기준입니다. 실제 재실행 시 `requirements.txt` 정비 필요.

## 🗂️ 원본 위치

- 원본: [yumenikkidiary/sidejob-data-collection](https://github.com/yumenikkidiary/sidejob-data-collection)
- AI-A가 중도하차하기 전 마지막 작업본 기준
- 우리 레포로 가져오면서 단계별 번호(`01_` ~ `07_`)와 명확한 이름으로 리네임

## 🧬 구버전 / 보조 출처

다음 파일들은 [`../archive_ai_a/crawler/`](../archive_ai_a/crawler/)에 보관:

- `clean_naver_kin.py` — 02의 v1 (구버전)
- `filter_failures.py`, `filter_naver_kin_story.py` — 04의 구버전들
- `naver_cafe.py`, `everytime.py` — 보조 출처 크롤러 (1차 MVP 범위 밖)
