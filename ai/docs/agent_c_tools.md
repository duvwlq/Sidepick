# 에이전트 C — Tool 명세서 (PM-04)

> 📌 **Status**: v1 (확정)
> 📌 **Last updated**: 2026-05-19
> 📌 **담당**: 팀장 (오혜림)
> 📌 **전달 대상**: BE, AI
> 📌 **관련 문서**: [`agent_c_plan_b.md`](./agent_c_plan_b.md), [`agent_c_routing.md`](./agent_c_routing.md)

---

## 1. 결정 사항

에이전트 C(부업 상담 에이전트)는 **Tool 2개**만 사용한다.

| # | Tool 이름 | 용도 |
|---|---|---|
| 1 | `search_cases` | FAISS 통합 인덱스에서 실패/성공 사례 검색 (type 메타데이터로 필터링) |
| 2 | `query_stats` | 업종별 통계 조회 / 실패 요인 TOP3 |

### 1.1 왜 Tool 2개인가? (1안 vs 2안 vs 3안)

| 안 | 구조 | 장단점 | 채택 |
|---|---|---|---|
| 1안 | 챗봇 Tool 1개 (`search_cases`만) + 통계는 챗봇 밖 페이지 | ReAct 안정성↑, 토큰↓ / 챗봇에서 통계 답변 불가 | ❌ |
| 2안 | `search_failure_cases` + `search_success_cases` (Tool 2개) | LLM이 의도 매칭 명확 / Tool 갯수↑, 통계 못 가져옴 | ❌ |
| **3안** | **`search_cases(type)` + `query_stats` (Tool 2개)** | **챗봇 한 곳에서 사례+통계 종합 답변 가능 / Tool 갯수 적절** | ✅ |

채택 이유: 1안 베이스에 통계 Tool을 추가한 형태. 성공사례 데이터 구조를 실패와 최대한 비슷한 스키마로 맞추어 단일 `search_cases` Tool로 통합 가능.

---

## 2. Tool 1: `search_cases`

### 2.1 시그니처

```python
search_cases(
    query: str,
    type: Literal["failure", "success"],
    limit: int = 3
) -> list[CaseResult]
```

### 2.2 파라미터

| 파라미터 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `query` | str | ✅ | 자연어 검색 쿼리 (예: "스마트스토어 마케팅") |
| `type` | "failure" or "success" | ✅ | 검색 대상 사례 종류 |
| `limit` | int | ❌ (기본 3) | 반환할 최대 사례 수 |

### 2.3 호출 예시

```python
# 실패 사례 검색
search_cases(query="스마트스토어", type="failure", limit=3)

# 성공 사례 검색
search_cases(query="스마트스토어", type="success", limit=3)
```

### 2.4 반환 데이터 스키마

**공통 필드 (failure / success 동일)**

| 필드 | 타입 | 설명 |
|---|---|---|
| `case_id` | str | 사례 고유 ID (예: `case_42`) — case_id 인용 강제 룰에 사용 |
| `original_text` | str | 원글 (사용자 작성 글) |
| `category` | str | 업종 (스마트스토어, 유튜브, 배달, 블로그, 강의, 콘텐츠, 기타 7개) |
| `duration_months` | int | 진행 기간 (개월) |
| `investment_amount` | int | 투자금 (원) |
| `keywords` | list[str] | 핵심 키워드 칩 |
| `ai_analysis` | str | AI 분석글 |
| `meta_grid` | dict | 메타 정보 (업종/기간/투자금/일평균시간 등 grid 형태) |

**type별 추가 필드**

| type | 추가 필드 | 설명 |
|---|---|---|
| `failure` | `failure_patterns` | 실패 패턴 리스트 |
| `failure` | `key_issues` | 핵심 이슈 칩 (예: `["초기투자과다", "마케팅부족"]`) |
| `success` | `success_factors` | 성공 요인 리스트 |
| `success` | `difference_from_user` | 나(사용자)와의 차이점 분석 |

---

## 3. Tool 2: `query_stats`

### 3.1 시그니처

```python
query_stats(
    category: str,
    metric: Literal["failure_rate", "failure_top3", "failure_timing"]
) -> StatsResult
```

### 3.2 파라미터

| 파라미터 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `category` | str | ✅ | 업종명 (스마트스토어, 유튜브 등 7개) |
| `metric` | enum | ✅ | 조회할 통계 종류 |

### 3.3 metric 종류

| metric | 반환 형태 | 용도 |
|---|---|---|
| `failure_rate` | `{category, rate, sample_size}` | 업종 실패율 |
| `failure_top3` | `[{rank, pattern, percentage}, ...]` | 업종별 실패 요인 TOP3 |
| `failure_timing` | `[{month, percentage}, ...]` | 실패 시점 분포 (1~12개월차별 비율) |

### 3.4 호출 예시

```python
# 스마트스토어 실패율
query_stats(category="스마트스토어", metric="failure_rate")

# 스마트스토어 실패 요인 TOP3
query_stats(category="스마트스토어", metric="failure_top3")
```

---

## 4. FAISS 인덱스 구조

```
faiss_index/
├── cases.index          # 실패 + 성공 통합 임베딩 (SBERT 768-dim)
└── cases_meta.json      # 메타데이터 (type, case_id, category 등)
```

- 통합 인덱스 사용 (실패/성공 분리 X)
- `type` 메타데이터 필드로 검색 시 필터링
- 업데이트 주기: 5~10분 배치 (신규 사례 등록 시 자동 반영)
- 메모리 모니터링: 100건 → 1,000건 → 1만 건 시나리오 검증 (3주차 BE 작업)

---

## 5. Tool 호출 시 환각 방지 룰

1. **`case_id` 인용 강제**: 응답 끝에 `[출처: case_42, case_77]` 형식으로 명시
2. **Tool 결과에 명시된 정보만 사용** (근거 없는 통계/수치 생성 금지)
3. **Tool 결과 0건일 경우**: "비슷한 사례를 찾지 못했어요" 안내 (Plan B 트리거 #2)
4. **카테고리 화이트리스트**: 7개 부업 카테고리 외 응답 차단

상세는 [`agent_c_plan_b.md`](./agent_c_plan_b.md) Plan B 트리거 #2 참고.

---

## 6. 다음 단계 (BE 인계 사항)

- [ ] BE: Tool 2개 API 엔드포인트 설계 (3주차 AI-A API 설계와 연동)
- [ ] BE: FAISS 통합 인덱스 메타데이터 스키마 확정
- [ ] AI: 시스템 프롬프트 v1 작성 시 Tool 설명 한국어로 작성 ([`AI-04`](#))
- [ ] AI: 50개 시나리오 테스트 시 Tool 호출 정확도 측정 (4주차)
