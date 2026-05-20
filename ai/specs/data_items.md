# AI 데이터 항목 명세 (3주차 시각화 작업용)

**작성일**: 2026-05-21
**작성자**: 오혜림 (AI 파트)
**대상**: BE (정근원) — 3주차 그래프/통계 API 구현 시 사용
**티켓**: SP-W1-AI-02

> 📌 본 문서는 3주차에 BE가 통계 API + 그래프 FE 연동을 진행할 때 사용할 데이터 항목과 JSON 포맷을 정의합니다.
> AI에서 가공한 데이터를 BE가 그대로 API로 내려주면 그래프 연동이 매끄럽게 됩니다.

---

## 1. 실패패턴 그래프 — "나와 같은 실수를 한 사람 X%"

### 화면 위치
- 사용자가 자신의 경험 작성 후 분석 결과 페이지 (개인 분석 결과 화면)
- 기존 MVP의 "실패 패턴 칩" 대신 그래프로 시각화 변경 (고도화 핵심)

### 데이터 항목

| 항목 | 타입 | 설명 |
|---|---|---|
| `user_case_id` | string | 사용자가 작성한 경험의 case_id |
| `user_failure_pattern` | string | 사용자의 주요 실패 패턴 (AI 분류 결과) |
| `user_category` | string | 사용자가 선택한 부업 카테고리 (7개 enum) |
| `similar_failure_count` | int | 동일 패턴 실패 사례 수 |
| `total_cases_in_category` | int | 해당 카테고리 전체 사례 수 |
| `similarity_percentage` | float | 동일 패턴 비율 (%) |
| `comparison_text` | string | 사용자에게 보여줄 문구 (예: "나와 같은 실수를 한 사람 42%") |
| `top_3_patterns` | array | 해당 카테고리 실패 패턴 TOP3 (사용자 패턴 강조 표시용) |

### JSON 응답 포맷

```json
{
  "user_case_id": "case_142",
  "user_failure_pattern": "마케팅 부족",
  "user_category": "콘텐츠·SNS",
  "similar_failure_count": 42,
  "total_cases_in_category": 100,
  "similarity_percentage": 42.0,
  "comparison_text": "나와 같은 실수를 한 사람 42%",
  "top_3_patterns": [
    {
      "rank": 1,
      "pattern": "마케팅 부족",
      "percentage": 42.0,
      "is_user_pattern": true
    },
    {
      "rank": 2,
      "pattern": "수익 구조 이해 부족",
      "percentage": 27.0,
      "is_user_pattern": false
    },
    {
      "rank": 3,
      "pattern": "시간 관리",
      "percentage": 19.0,
      "is_user_pattern": false
    }
  ]
}
```

### API Endpoint 제안
```
GET /api/stats/failure-pattern?case_id={user_case_id}
Response: 위 JSON 포맷
```

### 그래프 시각화 가이드 (PD/BE 참고)
- 막대 그래프 (가로) 권장
- 사용자 패턴은 색상 강조 (브랜드 컬러)
- 비교 문구는 그래프 상단에 큰 글씨로 표시

---

## 2. 실패 시점 분포 시각화

### 화면 위치
- 통계 페이지 (메인 메뉴에서 접근)
- 업종별로 사용자가 선택해서 조회

### 데이터 항목

| 항목 | 타입 | 설명 |
|---|---|---|
| `category` | string | 부업 카테고리 (7개 enum 중 하나) |
| `distribution` | array | 개월차별 실패 분포 |
| `peak_month` | int | 가장 많이 포기하는 개월차 |
| `peak_label` | string | 사용자 안내 문구 |
| `average_duration` | float | 평균 진행 기간 (개월) |
| `total_cases` | int | 해당 카테고리 총 사례 수 |

### JSON 응답 포맷

```json
{
  "category": "온라인 판매·이커머스",
  "distribution": [
    { "month": 1, "label": "1개월차", "percentage": 12.0, "count": 12 },
    { "month": 2, "label": "2개월차", "percentage": 28.0, "count": 28 },
    { "month": 3, "label": "3개월차", "percentage": 41.0, "count": 41 },
    { "month": 4, "label": "4개월차", "percentage": 19.0, "count": 19 }
  ],
  "peak_month": 3,
  "peak_label": "가장 많이 포기하는 시점",
  "average_duration": 2.7,
  "total_cases": 100
}
```

### API Endpoint 제안
```
GET /api/stats/failure-timeline?category={category_name}
Response: 위 JSON 포맷
```

### 그래프 시각화 가이드
- 가로 막대 그래프
- 피크 개월차는 색상 강조 + "가장 많이 포기하는 시점" 라벨
- 평균 진행 기간을 텍스트로 함께 표시

---

## 3. 업종별 통계 + 실패 요인 TOP3 (5주차 통계 페이지)

### 화면 위치
- 통계 페이지 메인
- 7개 카테고리 카드 형태로 노출

### 데이터 항목

| 항목 | 타입 | 설명 |
|---|---|---|
| `category` | string | 부업 카테고리 |
| `total_cases` | int | 총 사례 수 |
| `failure_rate` | float | 실패율 (%) |
| `success_rate` | float | 성공률 (%) |
| `top_3_failure_factors` | array | 실패 요인 TOP3 |
| `top_3_success_factors` | array | 성공 요인 TOP3 (성공사례 데이터 누적 후) |
| `average_investment` | int | 평균 초기 투자금 (원) |
| `average_duration` | float | 평균 진행 기간 (개월) |

### JSON 응답 포맷

```json
{
  "category": "콘텐츠·SNS",
  "total_cases": 100,
  "failure_rate": 73.0,
  "success_rate": 27.0,
  "top_3_failure_factors": [
    { "rank": 1, "label": "마케팅 부족", "percentage": 38.0 },
    { "rank": 2, "label": "수익 구조 이해 부족", "percentage": 27.0 },
    { "rank": 3, "label": "시간 관리", "percentage": 19.0 }
  ],
  "top_3_success_factors": [
    { "rank": 1, "label": "꾸준한 업로드", "percentage": 45.0 },
    { "rank": 2, "label": "명확한 컨셉", "percentage": 32.0 },
    { "rank": 3, "label": "타겟 분석", "percentage": 23.0 }
  ],
  "average_investment": 500000,
  "average_duration": 4.2
}
```

### API Endpoint 제안
```
GET /api/stats/category-stats?category={category_name}
Response: 위 JSON 포맷

GET /api/stats/all-categories
Response: 7개 카테고리 데이터 배열
```

### 시각화 가이드
- 카드 형식 (카테고리 카드)
- 실패율 / 성공률 비율 바
- TOP3 요인은 리스트
- 평균 투자금/기간은 카드 하단 메타 정보

---

## 4. 부업 시작 전 실패 조심 안내 (5주차)

### 화면 위치
- 사용자가 글 작성 단계에서 노출
- AI가 "성공 요인 부족"으로 감지 시 → 유사 실패사례 연결

### 데이터 항목

| 항목 | 타입 | 설명 |
|---|---|---|
| `user_input_keywords` | array | 사용자 입력에서 추출한 키워드 |
| `missing_success_factors` | array | 성공 사례 대비 부족한 요인 |
| `similar_failure_cases` | array | 유사 실패 사례 3건 |
| `warning_level` | string | "low" / "medium" / "high" |
| `warning_text` | string | 사용자에게 보여줄 안내 문구 |

### JSON 응답 포맷

```json
{
  "user_input_keywords": ["유튜브", "1주일 1시간", "썸네일 미신경"],
  "missing_success_factors": [
    "꾸준한 업로드 (성공 사례 평균: 주 3회)",
    "타겟 분석",
    "썸네일 신경"
  ],
  "similar_failure_cases": [
    { "case_id": "case_042", "summary": "...", "category": "콘텐츠·SNS" },
    { "case_id": "case_077", "summary": "...", "category": "콘텐츠·SNS" },
    { "case_id": "case_108", "summary": "...", "category": "콘텐츠·SNS" }
  ],
  "warning_level": "high",
  "warning_text": "비슷한 조건으로 시도한 분들 중 73%가 어려움을 겪었어요. 시작 전 한 번 더 확인해보시는 것도 좋을 것 같아요."
}
```

### API Endpoint 제안
```
POST /api/agents/pre-start-warning
Body: { "user_draft": "사용자가 작성 중인 글" }
Response: 위 JSON 포맷
```

---

## 5. AI 데이터 가공 흐름 (참고)

```
[사용자 글 작성/등록]
     ↓
[AI 분석 (5단계 파이프라인)]
     ↓
[AI가 데이터 가공]
  - 실패 패턴 분류 (49 매트릭스 매칭)
  - 카테고리 분류
  - 키워드 추출
  - 유사 사례 매칭 (SBERT + FAISS)
     ↓
[BE DB 저장]
     ↓
[통계 집계 (주기적 배치 또는 실시간)]
     ↓
[BE API 응답 (위 JSON 포맷)]
     ↓
[FE 그래프/차트 렌더링]
```

---

## 6. 통계 집계 주기 (BE 결정 필요)

| 데이터 | 권장 집계 주기 | 이유 |
|---|---|---|
| 실패패턴 그래프 | 실시간 계산 | 사용자 분석 결과와 함께 즉시 보여야 함 |
| 실패 시점 분포 | 1시간 배치 | 자주 안 바뀜 |
| 업종별 통계 | 1일 배치 | 자주 안 바뀜 / DB 캐시 7d 활용 |
| 실패 조심 안내 | 실시간 (LLM 호출) | 개인화 답변 |

→ FAISS 인덱스는 5~10분 배치 (`SP-W1-BE-03` 참조)

---

## 7. BE 작업 시 참고 사항

### 카테고리 enum (전체 시스템 통일)
```typescript
enum Category {
  ONLINE_SALES = "온라인 판매·이커머스",
  CONTENT_SNS = "콘텐츠·SNS",
  DIGITAL_GOODS = "디지털 상품·지식",
  PLATFORM_WORK = "플랫폼 노동",
  FREELANCE = "재능·프리랜서",
  INVESTMENT = "투자·재테크",
  OFFLINE = "오프라인 부업"
}
```

### 49 매트릭스 (실패 패턴 enum)
7개 카테고리 × 7개 실패 패턴 = 49가지 매트릭스
- 자세한 매핑은 MVP의 `49_matrix.json` 참조 (AI 폴더에 있음)

### 통계 데이터 캐시 (DB 답변 캐시)
- 통계 페이지 데이터: 7일 캐시
- 사례 검색 결과: 24시간 캐시
- 사용자 개인 분석 결과: 캐시 X (개인화)

---

## 8. 데이터 항목 확정 체크리스트 (BE 전달 확인)

- [x] 실패패턴 그래프 JSON 포맷 정의
- [x] 실패 시점 분포 JSON 포맷 정의
- [x] 업종별 통계 JSON 포맷 정의
- [x] 실패 조심 안내 JSON 포맷 정의
- [x] API endpoint 제안
- [x] 카테고리 enum 정의
- [x] 통계 집계 주기 제안
- [ ] BE 검토 후 피드백 (5/22 금 밤까지 BE 확인)

---

## 부록 — 변경 이력

| 버전 | 작성일 | 작성자 | 변경 사항 |
|---|---|---|---|
| v1 | 2026-05-21 | 오혜림 | 초안 작성 (4가지 데이터 항목) |
