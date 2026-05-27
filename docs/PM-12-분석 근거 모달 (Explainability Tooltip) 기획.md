# PM-12 — 분석 근거 모달 (Explainability Tooltip) 기획

**버전**: v2
**작성일**: 2026-05-27
**작성자**: 오혜림 (팀장 / PM)
**티켓**: PM-12
**대상**: AI / BE / PD / FE (4파트 협업)
**연관**: MVP 심사 피드백 #3 (유사 사례 매칭 정확도) + #4 (분석 흐름 구체화)

### v2 변경 이력 (2026-05-27)

- 3파트 합의 완료 (AI / BE / PD 수용 가능 회신)
- 적용 위치 P0 2곳으로 확정 (P1/P2는 베타테스트 후 결정)
- **데이터 스키마 TypeScript interface 형식으로 확정** (섹션 3 전면 개정)
- `_debug` 필드 옵션 A 채택 (모든 응답에 포함, FE 모달엔 표시 X)

> 📌 사용자가 AI 분석 결과나 유사 사례 매칭을 볼 때, "?" 아이콘 클릭/호버 시 **근거 정보**를 모달/툴팁으로 노출하는 기능.
> 일반 커뮤니티에는 없는 **검증 가능한 데이터** 차별화 포인트.

---

## 1. 배경 — 왜 분석 근거 모달인가?

### 1.1 MVP 심사 피드백 직접 대응

> "**유사 사례 매칭 정확도와 실패 원인 분석 기준이 더 구체화될 필요가 있습니다.**"
> "**사용자가 입력한 경험이 어떤 방식으로 분석되는지 결과 흐름 구체화**"

→ 분석 결과 자체보다 "왜 이런 결과가 나왔는지"를 사용자에게 노출 = 신뢰도↑

### 1.2 사이드픽 차별화 강화

심사위원이 짚은 "실패 데이터 자산화" 차별성을 **"검증 가능한 자산화"**로 한 단계 진화:
- 일반 커뮤니티: 결과만 보여줌
- 사이드픽: 결과 + 근거 + 신뢰도 + 출처 case_id 모두 노출

### 1.3 우리가 이미 보유한 안전장치 시각화

W1~W2에서 만든 안전장치를 사용자가 직접 확인 가능:
- 에이전트 B 자기검증 신뢰도 (< 0.7 발동) → 신뢰도 점수 노출
- case_id 인용 강제 (AI-05) → 원본 case 링크
- FAISS 유사도 점수 → 매칭 정량화
- 카테고리 화이트리스트 → 검색 범위 명시

---

## 2. 적용 위치 5곳 (우선순위)

### P0 — 핵심 (W4~W5 구현)

| # | 위치 | 트리거 | 모달 내용 |
|---|---|---|---|
| 1 | **AI 분석 결과 페이지** (실패 패턴 / 키워드) | "?" 아이콘 (각 패턴/키워드 옆) | 사용한 입력 데이터 / 매칭된 패턴 키워드 / 신뢰도 점수 / 분석에 사용된 유사 사례 N건 |
| 2 | **유사 사례 매칭 결과** (사례 카드) | "?" 아이콘 (사례 카드 상단 우측) | 유사도 점수 (예: 0.87) / 매칭 키워드 / 카테고리 일치 여부 / 원본 case_id 링크 |

### P1 — 보강 (W5 구현, 시간 여유 따라)

| # | 위치 | 트리거 | 모달 내용 |
|---|---|---|---|
| 3 | **에이전트 C 챗봇 응답** | 응답 메시지 하단 "근거 보기" 버튼 | case_id 인용 / Tool 호출 흐름 (FAISS or Stats) / 신뢰도 점수 |

### P2 — 추후 (W6 또는 V2)

| # | 위치 | 트리거 | 모달 내용 |
|---|---|---|---|
| 4 | **통계 시각화** (실패 요인 TOP3 / 시점 분포) | 차트 옆 "?" 아이콘 | 분석 대상 N건 / 데이터 출처 / 마지막 업데이트 시점 |
| 5 | **부업 가이드 카드** | 카드 하단 "출처" 텍스트 클릭 | PM-03 `sources` 필드 노출 (외부 자료 + 사이드픽 사례 분석 N건) |

---

## 3. 모달 데이터 스키마 (v2 확정 — TypeScript interface)

### 3.1 설계 원칙 5가지

| 원칙 | 적용 |
|---|---|
| **간결성** | 사용자가 이해 가능한 정보만. 내부 디버깅 메타는 응답에는 있어도 모달엔 표시 X |
| **확장성** | 미래 추가 필드 (V2 모델 비교 등)와 호환되는 구조 |
| **재사용성** | AI 분석 + 유사 사례 + 챗봇 모두 비슷한 패턴 (공통 베이스) |
| **타입 안정성** | TypeScript interface로 FE 받기 쉽게 |
| **null-safety** | 일부 필드 옵셔널 (예: agent_b 미발동 시 verification 필드 생략) |

### 3.2 공통 베이스 — `ExplanationBase`

모든 explanation 필드가 공유하는 베이스. (AI 분석 / 유사 사례 / 챗봇 모두 공통)

```typescript
interface ExplanationBase {
  confidence_score: number;       // 0~1, FE에서 %로 변환 (예: 0.87 → "87%")
  analysis_method: string;        // 사용자 노출용 짧은 설명
                                  // 예: "Claude Sonnet 4.5 + SBERT/FAISS 유사 사례 매칭"
  generated_at: string;           // ISO 8601 — FE에서 "5분 전" 상대 표시
}
```

### 3.3 P0 #1: AI 분석 결과 explanation

```typescript
interface AnalysisExplanation extends ExplanationBase {
  // 1) 사용된 입력 — 사용자가 본인 입력 재확인
  input_used: {
    category_name: string;          // "온라인 판매·이커머스" (slug 아닌 한글)
    difficulties_checked: string[]; // ["마케팅/홍보", "재고관리"]
    free_text_length: number;       // 자유서술 글자 수 (예: 142)
    duration_months: number;
    weekly_hours: number;
  };

  // 2) 매칭된 패턴 — 결과의 직접적 근거
  matched_patterns: Array<{
    pattern: string;                // "마케팅 비용 대비 매출 부진"
    confidence: number;             // 0~1
  }>;

  // 3) 분석에 사용된 유사 사례 — 출처 노출
  similar_cases_used: Array<{
    case_id: string;                // "case_42"
    title: string;                  // 카드 표시용
    similarity: number;             // 0~1
    link: string;                   // 원본 보기 URL (있을 때만)
  }>;

  // 4) 검증 상태 — 단순화 (사용자에겐 "검증 완료" / "검증 미통과"만)
  is_verified: boolean;             // 에이전트 B 통과 여부

  // 5) 내부 디버깅용 — 응답엔 항상 포함하되 FE 모달엔 표시 X (옵션 A)
  _debug?: {
    agent_b_threshold: number;      // 0.7
    regenerated: boolean;
    response_time_ms: number;
  };
}
```

### 3.4 P0 #2: 유사 사례 매칭 explanation

```typescript
interface SimilarCaseExplanation extends ExplanationBase {
  // 1) 유사도 — 사용자 노출 핵심
  similarity_score: number;         // 0~1, FE에서 % 표시

  // 2) 매칭된 키워드 — 왜 이 사례가 추천됐는지
  matched_keywords: string[];       // ["스마트스토어", "마케팅 비용", "6개월"]

  // 3) 카테고리 일치 — 단순 boolean
  category_match: boolean;          // 사용자 카테고리와 동일 여부

  // 4) 출처 정보
  source: string;                   // "blog" / "kin" / "cafe" / "community"
  case_id: string;                  // 원본 보기 링크용

  // 5) 내부 디버깅용 (옵션 A)
  _debug?: {
    embedding_model: string;        // "ko-sbert-nli"
    faiss_rank: number;             // 1-indexed
    user_category_slug: string;
    case_category_slug: string;
  };
}
```

### 3.5 P1 #3: 에이전트 C 챗봇 explanation (W5 추가 예정)

```typescript
interface ChatbotExplanation extends ExplanationBase {
  // 1) Tool 호출 흐름 — 어떤 데이터로 답변했는지
  tool_calls: Array<{
    tool: "search_cases" | "query_stats";
    args: Record<string, any>;      // 예: { query: "스마트스토어 시작", type: "failure" }
    result_count: number;
  }>;

  // 2) 인용된 case_id — 답변 근거
  cited_case_ids: string[];

  // 3) Plan B 발동 여부
  plan_b_triggered: boolean;
  plan_b_reason?: "iterations_exceeded" | "tool_empty_result" | "llm_parse_error"
                  | "timeout" | "tool_api_error";  // 발동 시만

  // 4) 응답 시간
  response_time_ms: number;
}
```

### 3.6 핵심 결정 사항 정리

| 결정 | 이유 |
|---|---|
| **`_debug` prefix로 내부 메타 분리** | BE 응답엔 포함 (옵션 A) FE 모달엔 노출 X. 미래 관리자 모드/모니터링 활용 |
| **`similarity` / `confidence`는 0~1 float** | DB 일관성. FE에서 % 변환 (반올림) |
| **`case_id`는 string** | "case_42" 형태 직관적 + 미래 namespacing 가능 ("blog_42" / "kin_15") |
| **`is_verified`는 boolean** | 단순화 (true → "검증 완료" 뱃지 / false → 표시 안 함) |
| **`generated_at` ISO 8601** | FE에서 상대 시간 변환 ("5분 전") |
| **공통 베이스 `ExplanationBase` 사용** | AI / 유사 사례 / 챗봇 공통 필드 재사용 |

### 3.7 BE API 응답 예시 (실제 형식)

#### POST /api/analyze 응답

```json
{
  "success": true,
  "data": {
    "analysis_id": "analysis_789",
    "result": {
      "keywords": ["초기투자과다", "마케팅부족", "재고관리실패"],
      "failure_category": "마케팅부족",
      "summary": "초기 자금 과다 투자 + 마케팅 부재로 재고 누적",
      "risk_level": "high"
    },
    "explanation": {
      "confidence_score": 0.87,
      "analysis_method": "Claude Sonnet 4.5 + SBERT/FAISS 유사 사례 매칭",
      "generated_at": "2026-06-15T14:23:45+09:00",
      "input_used": {
        "category_name": "온라인 판매·이커머스",
        "difficulties_checked": ["마케팅/홍보", "재고관리"],
        "free_text_length": 142,
        "duration_months": 6,
        "weekly_hours": 10
      },
      "matched_patterns": [
        { "pattern": "마케팅 비용 대비 매출 부진", "confidence": 0.92 },
        { "pattern": "재고 회전율 낮음", "confidence": 0.78 }
      ],
      "similar_cases_used": [
        { "case_id": "case_42", "title": "스마트스토어 6개월 후 닫은 후기", "similarity": 0.87, "link": "/cases/case_42" },
        { "case_id": "case_87", "title": "쿠팡 위탁판매 실패담", "similarity": 0.81, "link": "/cases/case_87" }
      ],
      "is_verified": true,
      "_debug": {
        "agent_b_threshold": 0.7,
        "regenerated": false,
        "response_time_ms": 4523
      }
    }
  }
}
```

#### POST /api/similar 응답 (유사 사례 매칭)

```json
{
  "success": true,
  "data": {
    "query_id": "query_456",
    "similar_cases": [
      {
        "case_id": "case_42",
        "title": "스마트스토어 6개월 만에 닫은 후기",
        "category": "online-commerce",
        "preview": "마케팅 비용 대비 매출이...",
        "explanation": {
          "confidence_score": 0.87,
          "analysis_method": "SBERT (ko-sbert-nli) 임베딩 + FAISS L2 거리",
          "generated_at": "2026-06-15T14:23:45+09:00",
          "similarity_score": 0.87,
          "matched_keywords": ["스마트스토어", "마케팅 비용", "6개월"],
          "category_match": true,
          "source": "blog",
          "case_id": "case_42",
          "_debug": {
            "embedding_model": "ko-sbert-nli",
            "faiss_rank": 1,
            "user_category_slug": "online-commerce",
            "case_category_slug": "online-commerce"
          }
        }
      }
    ]
  }
}
```

---

## 4. UI 컴포넌트 명세 (PD 디자인 인계)

### 4.1 "?" 아이콘 디자인

| 항목 | 값 |
|---|---|
| 크기 | 16x16px (본문) / 14x14px (카드 작은 영역) |
| 색상 | 회색 (#9CA3AF) → 호버 시 브랜드 컬러 |
| 위치 | 텍스트 우측 inline 또는 카드 우측 상단 |
| 모바일 | 호버 X → 탭으로 모달 열기 |
| 웹 | 호버 시 툴팁 / 클릭 시 모달 |

### 4.2 모달/툴팁 디자인

**툴팁 (간단 정보, 호버 시)**:
- 폭: 240~320px
- 내용: 핵심 1~3줄 (신뢰도 / 유사도 점수만)

**모달 (상세 정보, 클릭 시)**:
- 폭: 400~520px (데스크탑) / 전체 폭 (모바일)
- 헤더: "분석 근거" + X 닫기 버튼
- 본문: explanation 필드 항목별 카드
- 푸터: "이 분석을 어떻게 활용하나요?" 도움말 링크

### 4.3 정보 위계

```
[최상단]
  📊 신뢰도 87% (에이전트 B 검증 완료)

[중간]
  사용된 입력 데이터
  - 카테고리: 온라인 판매·이커머스
  - 어려웠던 점: 마케팅, 재고관리
  - 자유서술 길이: 142자

  매칭된 실패 패턴
  - 마케팅 비용 대비 매출 부진 (92%)
  - 재고 회전율 낮음 (78%)

  분석에 사용된 유사 사례
  - case_42 (87% 유사) → 원본 보기
  - case_87 (81% 유사) → 원본 보기
  - case_123 (76% 유사) → 원본 보기

[하단]
  분석 방법: Claude Sonnet + SBERT/FAISS 유사 사례 매칭
  마지막 업데이트: 2026-06-15
```

---

## 5. 4파트 작업 분배

| 파트 | 작업 | 우선순위 |
|---|---|---|
| **AI** | 분석 결과 JSON에 `explanation` 메타데이터 추가 (에이전트 A/B/C) | W4 P0 |
| **BE** | 응답 API에 `explanation` 필드 통과 + 기존 case_id 인용 연동 | W4 P0 |
| **PD** | "?" 아이콘 + 툴팁 / 모달 디자인 (P0 2곳) | W4 P0 |
| **FE** | 모달 컴포넌트 구현 (Radix UI Tooltip 또는 자체) + P0 2곳 통합 | W5 P0 |

---

## 6. 일정 (PDF v6.1에 신규 추가)

| 주차 | 작업 | 결과물 |
|---|---|---|
| W3 (6/1~6/7) | 3파트 합의 (AI/BE/PD) | PM-12 v2 (확정) |
| W4 (6/8~6/14) | AI explanation 메타 / BE API / PD 디자인 | API 명세 + 디자인 시안 |
| W5 (6/15~6/21) | FE 모달 컴포넌트 구현 + P0 2곳 통합 | 동작하는 모달 |
| W6 (6/22~6/25) | 시연 시나리오에 모달 동작 포함 | 발표 데모 |

→ **W6 시연 시 "이 분석 근거 보기" 클릭 한 번이 차별화 어필 포인트**

---

## 7. 베타테스트 평가 항목 (PD 인계)

베타테스트 2회 (W3 6/6) 또는 3회 (W4 6/13)에 추가:

| 질문 | 형식 | 목표 |
|---|---|---|
| Q. 분석 결과 옆 "?" 아이콘이 있는 걸 알고 있었나요? | Y/N | 발견율 70%+ |
| Q. 분석 근거 모달을 한 번이라도 열어봤나요? | Y/N | 사용률 40%+ |
| Q. 모달에서 본 정보가 분석 결과를 더 신뢰하게 만들었나요? | 1~5점 | 평균 4.0+ |
| Q. 어떤 정보가 가장 유용했나요? | 객관식 (신뢰도 / 유사 사례 / 매칭 키워드 / 입력 데이터) | 인사이트 도출 |
| Q. 추가로 보고 싶은 정보가 있다면? | 주관식 | V2 보강 |

---

## 8. 잠재 위험 + 대응

| 위험 | 대응 |
|---|---|
| 정보 과다 → UX 복잡도 증가 | P0 2곳만 우선 적용 + 모바일 모달 전체 폭 사용 |
| 모달 데이터가 부정확하면 신뢰도 역효과 | AI explanation 필드 검증 (W4 50개 시나리오 테스트 시 함께 확인) |
| 4파트 일정 동기화 부담 | W3 시작 전 3파트 합의 → W4 병렬 작업 |
| 모바일 호버 부재 | 탭 → 즉시 모달 열기로 통일 |

---

## 9. 종합 — 왜 PM-12를 만드나?

| 효과 | 설명 |
|---|---|
| ✅ **심사 피드백 #3, #4 직접 대응** | 매칭 정확도 + 분석 흐름 구체화를 UX에 녹임 |
| ✅ **차별화 강화** | "실패 데이터 자산화" → "검증 가능한 자산화"로 진화 |
| ✅ **기존 안전장치 활용** | 에이전트 B 신뢰도 / case_id 인용 / FAISS 점수 노출만 하면 됨 (신규 안전장치 X) |
| ✅ **시연 임팩트** | W6 발표 시 "분석 근거 보기" 클릭이 강력한 어필 |
| ✅ **V2 확장 기반** | 사용자 피드백 수집 → V2에 "분석 개선 제안" 기능 추가 가능 |

---

## 10. 다음 단계

- [x] PM-12 v1 명세 작성
- [x] AI/BE/PD 3파트 합의 (5/27 — 다들 수용 가능 회신)
- [x] PM-12 v2 — TypeScript interface 스키마 확정 + `_debug` 옵션 A 채택
- [ ] W4 시작 (6/8): AI explanation 메타 / BE API / PD 디자인 (병렬 작업)
- [ ] W5 (6/15~6/21): FE 모달 컴포넌트 구현 + P0 2곳 통합
- [ ] W6 (6/22~6/25): 시연 시나리오에 모달 동작 포함
- [ ] 베타테스트 3회 (6/13) 또는 4회 (6/20)에 평가 항목 추가
