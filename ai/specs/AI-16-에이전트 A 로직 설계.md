# AI-16 — 에이전트 A (글 작성 보조) 로직 설계 + API 스펙

**작성일**: 2026-06-02
**작성자**: 오혜림 (팀장)
**티켓**: AI-16
**상태**: v1
**의존성**: AI-09 (가이드형 글쓰기 예시 49개) / PM-04 (Tool 명세) / 베타 1회차 피드백 (PM-13)
**연계 BE 티켓**: BE-27

---

## 1. 목적

사용자가 부업 경험 글을 작성할 때 **초안을 분석해서 부족한 정보를 감지**하고, **3~5개의 보완 질문 카드**를 생성한다. 사용자 답변을 받아 글을 보완한 후 본문 + 메타 데이터를 함께 저장.

**왜 필요한가** (베타 1회차 피드백 반영):
- "자유 서술 작성"에서 4명이 가장 오래 머무름 (PM-13 시나리오 3)
- 사용자가 어떤 정보를 적어야 할지 막막함 → 작성 예시 4.00/5점이지만 보완 질문이 더 효과적

---

## 2. 사용 시나리오

```
[사용자]
1. 카테고리 선택 (7개 분야 칩)
2. 기본 메타 입력 (기간 / 시간 / 투자금 / 수익)
3. 본문 작성 (자유 서술 50자+)
4. "다음" 버튼 클릭
        ↓
[FE]
5. 분석 중 화면 노출
        ↓
[에이전트 A 호출]
6. 초안 분석 (본문 + 메타)
7. 부족 정보 감지 (3~5개)
8. needs_questions 판단
        ↓
[분기]
9-A. needs_questions = true → 질문 카드 노출 (스킵 가능)
10-A. 사용자 답변 수집 후 본문 보완
11-A. 본문 + 메타 + 보완 답변 → 사례 저장

9-B. needs_questions = false → 질문 카드 없이 바로 사례 저장
```

---

## 3. 부족 정보 감지 로직

### 3.1 감지 대상 8개 슬롯 (v1.1 — enum 명세 / BE-27 인계)

```typescript
// BE Java: enum Slot { CATEGORY, DURATION, DAILY_HOURS, INVEST_AMOUNT,
//                      REVENUE_AMOUNT, FAILURE_REASONS, DIFFICULTIES, BODY_RICHNESS }
type Slot =
  | "category"          // 부업 분야 (PM-03 v1.6 7개 분야 + etc)
  | "duration"          // 진행 기간 5단계 bucket
  | "daily_hours"       // 일일 투입 시간 4단계
  | "invest_amount"     // 투자 금액 (KRW, ≥0 허용)
  | "revenue_amount"    // 월 평균 수익 (KRW, ≥0 허용)
  | "failure_reasons"   // 실패 원인 (7종 화이트리스트)
  | "difficulties"      // 어려웠던 점 (8종 화이트리스트)
  | "body_richness";    // 본문 풍부도 (길이 + 단어 다양성)
```

| 슬롯 | 확인 방법 | 부족 판정 기준 |
|---|---|---|
| `category` | 메타 입력 필수 | 미선택 시 — UI에서 강제, 에이전트 미감지 |
| `duration` | 메타 입력 | 미선택 OR "기타" |
| `daily_hours` | 메타 입력 | 미선택 |
| `invest_amount` | 메타 입력 | 미입력 (0 허용) |
| `revenue_amount` | 메타 입력 | 미입력 (0 허용) |
| `failure_reasons` | **본문 키워드 분석** | 본문에 실패 원인 단어 0건 |
| `difficulties` | **본문 키워드 분석** | 본문에 어려움 단어 0건 |
| `body_richness` | **본문 길이** | 50자 미만 OR 단어 다양성 < 임계치 |

### 3.2 본문 기반 감지 키워드

**실패 원인 키워드 (failure_reasons 슬롯)** — 픽플리 100건 실패 원인 7종 기반:
- 마케팅: "마케팅 / 광고 / 홍보 / 노출 / SNS"
- 시장 조사: "조사 / 트렌드 / 시장 / 경쟁 / 수요"
- 실행력: "꾸준 / 지속 / 포기 / 미루 / 의지"
- 자본: "자본 / 자금 / 투자비 / 비용 / 예산"
- 시간: "시간 / 본업 / 병행 / 체력 / 바쁘"
- 경쟁: "경쟁 / 레드오션 / 포화"

**어려움 키워드 (difficulties 슬롯)** — 픽플리 어려운 점 8종 기반:
- 고객 확보 / 수익 구조 / 수익화 / 시간 관리 / 운영 지속 / 정보 / 경쟁 / 멘탈

→ 본문 매칭 0건이면 부족 판정 → 질문 생성.

### 3.3 우선순위 (3~5개 선정)

1. **P0 (반드시 질문)**: failure_reasons / difficulties / body_richness 부족
2. **P1 (메타 비어있을 때)**: invest_amount / revenue_amount / duration
3. **P2 (선택)**: daily_hours

→ 최대 5개까지. 부족 슬롯이 5개 초과면 P0 → P1 → P2 순으로 5개 선정.

---

## 4. 질문 생성 (Claude Sonnet 호출)

### 4.1 호출 조건

- 부족 슬롯이 **2개 이상** 감지될 때만 Sonnet 호출
- 1개 이하면 미리 정의된 템플릿 질문으로 처리 (비용 절감)

### 4.2 입력

- 사용자 본문 (≤ 1,500자 cap)
- 카테고리 slug + 한글명
- 감지된 부족 슬롯 리스트

### 4.3 출력 (질문 카드 JSON)

```typescript
interface QuestionCard {
  slot: Slot;                // 3.1 enum 8종 중 1개
  question: string;          // 사용자에게 보일 질문 (40자 이내, "~예요?" / "~인가요?" 친근체)
  hint?: string;             // 답변 예시 (선택, AI-09 가이드 예시 참고, 1인칭 30~60자)
  input_type: InputType;     // 4.5 enum
  options?: string[];        // input_type="select"일 때 필수, 4.6 화이트리스트만 허용
  required: boolean;         // true면 답변 필수, false면 스킵 가능
  placeholder?: string;
}

type InputType = "text" | "select" | "number" | "tag";
```

### 4.5 질문 wording 룰 (v1.1 — BE-27 인계)

| 항목 | 규칙 |
|---|---|
| **어미** | "~예요?" / "~인가요?" / "~어요?" 친근체 강제 |
| **시점** | 2인칭 ("처음 ~하셨어요?" / "~ 알려주실 수 있어요?") |
| **길이** | question 40자 이내 / hint 30~60자 (1인칭 예시) |
| **금지 표현** | "반드시 / 무조건 / 100% / 절대" |
| **광고성 금지** | 외부 서비스 / 강의 / 멘토링 언급 X |
| **input_type 매핑** | category/duration/daily_hours/failure_reasons/difficulties → `select` / invest_amount/revenue_amount → `number` / body_richness/free_text → `text` |
| **placeholder** | number는 "0이면 0 입력" / text는 "30자 이상 권장" |

### 4.6 options 화이트리스트 (v1.1 — BE-27 인계)

```typescript
// failure_reasons 7종 (픽플리 설문 기준)
const FAILURE_REASONS = [
  "마케팅 부족", "수익 구조 이해 부족", "시간 관리",
  "정보 부족", "경쟁 심화", "자본 부족", "실행력 부족",
] as const;

// difficulties 8종 (픽플리 설문 기준)
const DIFFICULTIES = [
  "고객 확보(마케팅)", "수익 구조 이해", "수익화 연결",
  "시간 관리", "운영 지속성", "정보 부족",
  "경쟁 심화", "멘탈 관리",
] as const;

// duration 5단계 bucket
const DURATION_BUCKETS = [
  "1개월 미만", "1~3개월", "3~6개월", "6개월~1년", "1년 이상",
] as const;

// daily_hours 4단계
const DAILY_HOURS = [
  "1시간 미만", "1~3시간", "3~5시간", "5시간 이상",
] as const;

// category 8종 (PM-03 v1.6 부업 분야 7 + etc)
const CATEGORY_SLUGS = [
  "online-commerce", "content-sns", "digital-products", "platform-labor",
  "talent-freelance", "investment", "offline-sidejob", "etc",
] as const;
```

**검증 룰**: Sonnet 응답에 위 화이트리스트 외 옵션이 나오면 즉시 fail + 재시도.

### 4.4 예시 출력

```json
{
  "questions": [
    {
      "slot": "failure_reasons",
      "question": "어떤 부분이 가장 어려웠나요?",
      "hint": "예: 마케팅 비용 대비 매출이 안 나왔어요",
      "input_type": "select",
      "options": [
        "마케팅 부족", "수익 구조 이해 부족", "시간 관리",
        "정보 부족", "경쟁 심화", "자본 부족", "실행력 부족"
      ],
      "required": true
    },
    {
      "slot": "invest_amount",
      "question": "처음에 얼마 정도 투자하셨어요?",
      "input_type": "number",
      "placeholder": "0이면 0 입력",
      "required": false
    },
    {
      "slot": "body_richness",
      "question": "처음 시작한 계기를 한 줄로 적어주실 수 있어요?",
      "hint": "예: 본업 외 수익을 더 만들고 싶어서 시작했어요",
      "input_type": "text",
      "placeholder": "30자 이상 권장",
      "required": false
    }
  ]
}
```

---

## 5. BE-27 API 스펙

### 5.1 Endpoint

```
POST /api/agent-a/analyze-draft
Content-Type: application/json
Authorization: Bearer {jwt}
```

### 5.2 Request

```typescript
interface AnalyzeDraftRequest {
  draft: {
    category_slug: string;     // 7개 부업 분야 slug 중 1개
    category_label: string;    // 한글명 (참고용)
    duration?: string;         // "1~3개월" / "3~6개월" / "6개월~1년" / "1년 이상" / "1개월 미만"
    daily_hours?: string;      // "1시간 미만" / "1~3시간" / "3~5시간" / "5시간 이상"
    invest_amount?: number;    // KRW
    revenue_amount?: number;   // KRW
    has_main_job?: boolean;
    body: string;              // 사용자 자유 서술
  };
  user_id?: string;            // 트레이싱용
}
```

### 5.3 Response — 성공

```typescript
interface AnalyzeDraftResponse {
  status: "ok";
  needs_questions: boolean;    // true면 질문 카드 노출, false면 바로 저장 가능
  detected_missing_slots: string[];  // 감지된 부족 슬롯 ID 리스트
  questions: QuestionCard[];   // 최대 5개, needs_questions=false면 빈 배열
  confidence: number;          // 분석 자신도 0.0~1.0
  meta: {
    model: string;
    prompt_version: string;
    input_tokens: number;
    output_tokens: number;
    elapsed_ms: number;
    used_template: boolean;    // true면 Sonnet 미호출 (1개 이하 슬롯)
  };
}
```

### 5.4 Response — Plan B fallback (PM-05 연계)

```typescript
interface AnalyzeDraftFallbackResponse {
  status: "fallback";
  reason: "timeout" | "parse_error" | "llm_error";
  needs_questions: false;      // 강제 false
  questions: [];
  message: string;             // 사용자에게 보일 메시지 ("질문 카드를 생성하지 못했어요. 그대로 저장하시거나 다시 시도해주세요.")
}
```

### 5.5 HTTP 상태 코드

- `200 OK`: 정상 분석 완료 (questions 0개 OK)
- `200 OK`: Plan B fallback (status="fallback")
- `400 Bad Request`: 필수 필드 누락 (category_slug / body 없음)
- `401 Unauthorized`: JWT 없음 또는 만료
- `429 Too Many Requests`: rate limit (1분 5회 초과)
- `500 Internal Server Error`: 서버 오류

---

## 6. 환각 방지 룰 (AI-05 적용)

1. **질문은 사실 기반** — 본문 내용을 왜곡하거나 단정 금지
2. **카테고리 화이트리스트** — slot은 8개 정의된 것만
3. **options 화이트리스트** — failure_reasons select 시 7종만 (픽플리 정의)
4. **금지 표현** — "반드시 / 무조건 / 잘못된" 등 단정 표현

---

## 7. 비용 예산

| 항목 | 추산 |
|---|---|
| 평균 본문 | 800자 ≈ 400 tokens |
| 시스템 프롬프트 | 600 tokens |
| 사용자 케이스당 입력 | ≈ 1,000 tokens |
| 출력 (질문 카드 JSON) | ≈ 400 tokens |
| Sonnet 비용 | $3/1M in + $15/1M out |
| **1회 호출 비용** | **≈ $0.009 (≈ 12원)** |
| 일일 1,000건 가정 | $9 / 일 (월 $270) |

→ MVP 사용량 기준 부담 미미. 단 USE_MOCK_LLM 분기 필수.

---

## 8. UI 흐름 가이드 (FE 인계)

```
[글 작성 페이지 4단계]
1. 카테고리 칩
2. 메타 입력 (기간/시간/투자금/수익)
3. 본문 (자유 서술)
4. AI 보완 질문 카드 (에이전트 A 결과)
   ├─ "질문 카드 생성 중..." 로딩 (1~3초)
   ├─ 카드 3~5개 + 각 카드 답변 입력
   ├─ "스킵" 버튼 (required=false 카드만)
   └─ "완료" 버튼 → 저장
```

**Plan B fallback UI** (status="fallback"):
- 빈 카드 영역에 "질문 카드 생성 실패 — 그대로 저장하시거나 다시 시도해주세요" + [그대로 저장] / [다시 시도] 버튼

---

## 9. 의존성 / 인계

### 9.1 AI 의존
- AI-09: 질문 hint에 49개 가이드 예시 참고
- AI-04: 시스템 프롬프트 톤 일관성
- AI-05: 환각 방지 룰
- AI-15 (W3 후속): 에이전트 B 자기검증 — 질문 자체가 부적절하면 재생성

### 9.2 BE-27 인계 사항
- API endpoint 위 5절 그대로 구현
- AI 서버 호출 wrapper (timeout 10초 권장)
- Plan B fallback 처리
- JWT 검증 + rate limit
- 입력 검증 (category_slug 화이트리스트)

### 9.3 FE 인계 사항 (별도 티켓)
- 질문 카드 컴포넌트 (input_type 4종 지원)
- 로딩 / Plan B fallback UI
- 답변을 본문에 합치는 로직 (저장 시)

---

## 10. DoD 체크리스트

- [x] 초안 분석 로직 (8개 슬롯 + 본문 키워드 매칭)
- [x] 질문 생성 프롬프트 (3~5개)
- [x] BE-27 API 스펙 (request / response / fallback / HTTP code)
- [ ] BE 인계 (디스코드, docs/_local/에 메시지 작성)
- [ ] AI 서버 구현 (W3 후속 — 별도 작업)
- [ ] 단위 테스트 (W3 후속)

---

## 11. 변경 이력

| 버전 | 날짜 | 작성자 | 변경 |
|---|---|---|---|
| v1 | 2026-06-02 | 오혜림 | 초안 작성 (베타 1회차 피드백 반영) |
| v1.1 | 2026-06-10 | 오혜림 | BE-27 회신 반영 — slot 8종 enum 명시 (3.1) + 질문 wording 룰 강화 (4.5) + options 5종 화이트리스트 (4.6) |
