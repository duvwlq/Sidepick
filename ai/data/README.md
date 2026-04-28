# data/ — 실제 사용 데이터

부업 실패 사례 데이터셋. AI-A가 네이버 지식iN에서 수집·정제한 결과를 yumenikkidiary 레포에서 가져온 최신본.

## 📂 파일 목록

| 파일 | 설명 | 행 수 |
|---|---|---|
| `failure_cases_49.csv` | ⭐ **핵심 49건 실패 사례** (최종 정제본) | 49 |
| `pending_review.csv` | 검수 필요 데이터 (애매한 케이스) | ~20 |
| `full_cleaned.csv` | 전체 본문 클렌징본 (최대 데이터셋) | 280+ |
| `archive/` | v2/v3 중간 산출물 (참고용) | - |

## 📊 데이터 출처

- **출처**: 네이버 지식iN 검색 API + 본문 직접 크롤링
- **수집 키워드**: 부업, 투잡, 실패 관련
- **수집 규모**: 약 1,000개 후보 → 정제 단계 거쳐 49건 확정

## 🔍 컬럼 스키마

```
source         데이터 출처 (naver_kin)
keyword        검색 키워드
title          글 제목
description    요약 내용
full_text      본문 (직접 크롤링한 풀텍스트)
link           원문 링크
pubDate        작성일
text_length    텍스트 길이
label          라벨 (현재는 unlabeled)
```

## 📐 정제 기준

`failure_cases_49.csv`는 아래 조건을 모두 만족:

1. **1인칭 표현** — "저는", "제가" 등 직접 경험 서술
2. **경험 서사 구조** — 시작 → 과정 → 결과 형태
3. **실패 표현** — 손해, 적자, 포기 등 명시적 실패 진술

## 🗄️ archive/ 디렉토리

이전 버전들의 중간 산출물. 49건이 어떻게 도출됐는지 추적용.

| 파일 | 의미 |
|---|---|
| `naver_kin_cleaned.csv/json` | v2 클렌징본 |
| `naver_failure_only.csv` | v3 1차 실패 필터링본 |
| `naver_kin_full_raw.csv` | 본문 풀 raw (확장 직후) |

## 📝 데이터 품질 리포트

상세 품질 분석은 [`../docs/data_quality_report.md`](../docs/data_quality_report.md) 참조.

## ⚠️ 주의사항

- 49건은 **현재 분량이 부족**한 상태입니다 (강사 피드백). 추가 수집 또는 review 데이터 검수가 필요합니다.
- `output_text` 같은 T5 학습용 변환 데이터는 **포함되지 않음** (T5 모델 학습 폐기됨, Claude API로 대체).
