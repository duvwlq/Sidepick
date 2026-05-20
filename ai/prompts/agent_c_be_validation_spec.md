# Agent C — BE 응답 검증 명세 (BE 전달용)

**작성일**: 2026-05-21
**작성자**: 오혜림 (AI 파트)
**대상**: BE (정근원)
**연관 티켓**: SP-W1-BE-06 (가드레일 인프라 설계)
**참조**: `ai/prompts/agent_c_v1.md`

> 📌 본 문서는 시스템 프롬프트 v1과 함께 BE 응답 검증 로직 구현 시 사용합니다.
> 4주차 SP-W1-BE-06 (가드레일 인프라 설계) 작업의 핵심 명세입니다.

---

## 1. case_id 인용 형식 검증

### 정규식
```python
import re

INSTANCE_PATTERN = r'\[출처:\s*(case_\d+(,\s*case_\d+)*|업종 통계 — [가-힣·\s]+)\]'

def validate_citation(response: str) -> bool:
    return bool(re.search(INSTANCE_PATTERN, response))
```

### 허용 형식
- `[출처: case_042]` — 사례 1개
- `[출처: case_042, case_077, case_108]` — 사례 여러 개
- `[출처: 업종 통계 — 콘텐츠·SNS]` — 통계만 사용
- `[출처: case_042, 업종 통계 — 콘텐츠·SNS]` — 사례 + 통계 혼합

### 검증 실패 시
1. 같은 prompt로 재생성 (max 1회)
2. 재생성도 실패 시 Plan B (단순 RAG fallback)

---

## 2. 카테고리 화이트리스트

```python
ALLOWED_CATEGORIES = {
    "온라인 판매·이커머스",
    "콘텐츠·SNS",
    "디지털 상품·지식",
    "플랫폼 노동",
    "재능·프리랜서",
    "투자·재테크",
    "오프라인 부업"
}
```

### 검증 로직
- 응답에서 부업 카테고리 명사 추출
- 추출된 카테고리가 화이트리스트에 있는지 확인
- 외부 카테고리 (예: "주식 단타", "코인 단타") 언급 시 → 재생성 → Plan B

---

## 3. 수치 검증

### 룰
- 응답의 "X%" / "X명" / "X건" 같은 수치는 반드시 Tool 결과(`query_stats`, `search_cases`)에 존재해야 함
- Tool 결과에 없는 수치 발견 시 → 환각으로 판단 → 재생성 → Plan B

### 구현 예시
```python
def validate_numbers(response: str, tool_results: list) -> bool:
    # 응답에서 모든 수치 추출
    response_numbers = set(re.findall(r'\d+(?:\.\d+)?%?', response))

    # Tool 결과에서 모든 수치 추출
    tool_numbers = set()
    for result in tool_results:
        tool_numbers.update(extract_numbers_from_dict(result))

    # 응답 수치가 Tool 결과에 모두 있는지 확인
    return response_numbers.issubset(tool_numbers)
```

---

## 4. BANNED_WORDS 검증

### 적용 룰
- MVP에서 작성한 `BANNED_WORDS v1` 그대로 적용
- 입력(사용자 질문) + 출력(LLM 응답) 양쪽 검증
- 차단 시 사용자 안내: "부적절한 표현이 포함되어 있어요."

### 위치
- 입력 가드레일: 챗봇 요청 받는 시점
- 출력 가드레일: LLM 응답 후 / case_id 검증 전

---

## 5. case_id 존재 검증

### 룰
- 인용된 `case_id`가 실제 DB에 존재하는지 확인
- 존재하지 않는 `case_id` 인용 시 → 환각 → 재생성 → Plan B

### 구현 예시
```python
def validate_case_ids_exist(response: str) -> bool:
    cited_ids = re.findall(r'case_(\d+)', response)
    if not cited_ids:
        return True  # 통계만 사용한 경우

    # DB에서 case_id 존재 확인
    existing_ids = db.query("SELECT case_id FROM cases WHERE case_id IN %s", cited_ids)
    return set(cited_ids) == set(existing_ids)
```

---

## 6. 응답 검증 통합 흐름

```
[LLM 응답 수신]
   ↓
[1] BANNED_WORDS 검증
   - 차단 시 → 재생성 (max 1회) → Plan B
   ↓
[2] 카테고리 화이트리스트 검증
   - 외부 카테고리 시 → 재생성 → Plan B
   ↓
[3] 수치 검증
   - Tool 결과에 없는 수치 시 → 재생성 → Plan B
   ↓
[4] case_id 인용 형식 검증
   - 형식 미충족 시 → 재생성 → Plan B
   ↓
[5] case_id 존재 검증
   - DB에 없는 ID 시 → 재생성 → Plan B
   ↓
[검증 통과 → 사용자에게 응답 전달]
```

### 재생성 정책
- 모든 검증 실패 시 같은 룰
- **재생성 횟수: max 1회**
- 재생성도 실패 시 → **Plan B 자동 전환** (단순 RAG fallback)
- 로그: `validation_failure: {reason}` 형식으로 기록

---

## 7. 자기검증 루프 (에이전트 B) 연동

검증 통과한 응답을 에이전트 B 자기검증 루프에 전달:

```
[검증 통과 응답]
   ↓
[에이전트 B 자기검증]
   - 신뢰도 점수 계산 (코사인 유사도 / 업종 분류 / case_id 정확도)
   - 신뢰도 < 0.7 → 재생성 1회 → 결과 캐싱
   ↓
[사용자에게 응답 전달]
```

---

## 8. 환경 변수 (BE-04 연관)

```bash
# .env
PROMPT_VERSION=v1
AGENT_C_PROMPT_PATH=ai/prompts/agent_c_v1.md
VALIDATION_RETRY_MAX=1
SELF_VERIFICATION_THRESHOLD=0.7
```

---

## 9. 4주차 50개 시나리오 테스트 계획

### 환각 발생률 측정 항목
1. **정상 질문** (20개): 일반적인 부업 상담 질문
2. **모호한 질문** (10개): 의도 불명확한 질문
3. **데이터 없는 질문** (10개): Tool 결과 0건 예상
4. **카테고리 외 질문** (10개): 7개 카테고리 외 (예: 주식 단타)

### 합격 기준
- 환각 발생률 < 10% (자기검증 적용 전)
- 환각 발생률 < 3% (자기검증 적용 후) — **목표**
- 각 검증 단계별 발동 빈도 측정

---

## 부록 — 변경 이력

| 버전 | 작성일 | 작성자 | 변경 사항 |
|---|---|---|---|
| v1 | 2026-05-21 | 오혜림 | 초안 (시스템 프롬프트 v1과 함께 작성) |
