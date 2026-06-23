# PM-14 — 성공사례 AI 분석글 기획

**작성일**: 2026-06-02
**작성자**: 오혜림 (팀장)
**티켓**: PM-14
**상태**: v1 (AI-14 dry-run 기준)
**의존성**: PM-04 (Tool 명세) / AI-05 (환각 방지 룰) / AI-10 (labeled_success_sample.csv)

---

## 1. 목적

`success` 라벨이 붙은 성공사례 글 183건 중 본문 보유 + 카테고리 다양성 기준 30~50건에 대해
Claude Sonnet으로 **AI 분석글 초안**을 생성한다.

생성된 분석글은:
- **사례 카드 상세 페이지**에 "AI 분석" 섹션으로 노출 (1차 사용처)
- **사용자 글 분석 시 유사 사례 비교 카드**에 일부 발췌 노출 (2차 사용처)
- 환각 방지를 위해 **case_id 인용 강제** (AI-05 룰)

---

## 2. 분석글 출력 스키마 v1

```typescript
interface SuccessAnalysisDraft {
  case_id: string;              // 원본 케이스 ID (예: "blog_001")

  // 카테고리 (Claude가 본문 기반 추론 — etc 80% 문제 해결)
  category_inferred: {
    slug: string;               // PM-03 v1.6 7개 부업 분야 slug 중 1개
    label_ko: string;           // 한글명
    confidence: number;         // 0.0~1.0 (Claude의 분류 자신도)
  };

  // 구체적 업종 (예: "스마트스토어 화장품 / 유튜브 IT 리뷰")
  industry: string;             // 40자 이내, 자유 텍스트

  // 성공 요인 3가지 (각 factor에 본문 인용)
  success_factors: Array<{
    title: string;              // 짧은 제목 (20자 이내)
    description: string;        // 본문 인용 + 분석 (60~120자)
    quoted_phrase: string;      // 본문에서 직접 인용된 구절 (≤ 50자)
  }>;

  // 일반 실패자와의 차이점 (사용자 글 분석 시 "왜 이 사람은 성공했나" 설명용)
  difference_from_failures: string;  // 150~250자, 본문 기반 분석

  // 신뢰도 — AI-15 에이전트 B 자기검증 루프 입력
  confidence_score: number;     // 0.0~1.0
                                // = (category_inferred.confidence + 본문 인용 일치도) / 2

  // 메타
  meta: {
    generated_at: string;       // ISO 8601 KST
    model: string;              // "claude-sonnet-4-6" 등
    prompt_version: string;     // "AI-14-v1"
    input_tokens: number;
    output_tokens: number;
  };

  // 원본 출처 (UI에 "근거 보기" 클릭 시 노출 — PM-12 explanation 연계)
  sources: {
    case_id: string;
    title: string;
    link: string;               // 원본 URL
    excerpt: string;            // 본문 발췌 (≤ 200자)
  };
}
```

---

## 3. 톤 & 문체 가이드

| 항목 | 가이드 |
|---|---|
| 어미 | "~예요/요" (친근체) |
| 시점 | 3인칭 ("이 분은 / 작성자는") |
| 길이 | success_factors 각 60~120자, difference 150~250자 |
| 인용 | `> "..."` 형식 또는 본문 발췌 짧게 |
| 금지 | 단정적 조언 ("반드시 ~하세요"), 환각 (본문에 없는 사실), 광고성 표현 |

**예시 (Good)**:
> 이 분은 본업 외 시간을 활용해 꾸준한 콘텐츠 업로드(주 3회 이상)를 6개월 이상 유지했어요.
> 본문에 "퇴근 후 매일 30분씩 영상 편집"이라는 구절이 있는 만큼 시간 투입이 핵심이었어요.

**예시 (Bad)**:
> 부업으로 성공하려면 반드시 매일 작업해야 합니다. (← 단정적 + 본문 미인용)

---

## 4. 카테고리 추론 (etc 80% 문제 해결)

현재 `labeled_success_sample.csv`의 카테고리 분포:
- etc 100건 (81%)
- content-sns 10 / online-commerce 7 / digital-products 4 / platform-labor 2 = 23건 (19%)

→ Claude에게 본문 기반으로 7개 부업 분야 중 1개를 추론하게 함.
→ `category_inferred.confidence < 0.7`인 케이스는 etc로 유지 + 에이전트 B 검토 대상.

**7개 부업 분야 slug (PM-03 v1.6)**:
1. `online-commerce` — 온라인 판매·이커머스
2. `content-sns` — 콘텐츠·SNS
3. `digital-products` — 디지털·지식판매
4. `platform-labor` — 플랫폼 노동
5. `talent-freelance` — 재능·프리랜서
6. `investment` — 투자·재테크
7. `offline-sidejob` — 오프라인 부업

---

## 5. 분석 대상 선정 기준 (30~50건)

1. `true_label == "success"` (183건 후보)
2. `len(full_text) >= 500` (123건으로 축소)
3. **카테고리 균형** — 7개 분야별로 최대 8건씩 추출 (총 약 56건 한도)
4. etc 100건도 일부 포함 (Claude 추론 검증용)
5. 본문 점수 (length × keyword_density) 상위순

**dry-run 10건**: 7개 분야 각 1~2건 + etc 2건 = 10건 균형 샘플로 품질 검증 먼저.

---

## 6. 비용 예산

| 항목 | 추산 |
|---|---|
| Sonnet 입력 단가 | $3 / 1M tokens |
| Sonnet 출력 단가 | $15 / 1M tokens |
| 케이스당 입력 | ≈ 800 tokens (본문 1,500자 + 프롬프트) |
| 케이스당 출력 | ≈ 500 tokens (분석글 + JSON 포맷) |
| 50건 호출 | 입력 40K + 출력 25K ≈ **$0.50** |
| 123건 전체 | 입력 100K + 출력 62K ≈ **$1.23** |

→ MVP 예산 영향 미미. 단 LangSmith 트레이스로 모니터링 의무.

---

## 7. 환각 방지 룰 (AI-05 적용)

1. **본문에 없는 사실 생성 금지** — `quoted_phrase`는 본문에서 substring으로 검증
2. **case_id 인용 강제** — sources.case_id는 입력 케이스와 일치
3. **카테고리 화이트리스트** — slug는 PM-03 7개 부업 분야 외 불가 (또는 etc)
4. **단정 표현 금지** — "반드시 / 무조건 / 100% / 절대" 출력 시 검토 플래그

검증 로직 (스크립트 내):
```python
def validate_draft(draft, original_text):
    issues = []
    for factor in draft["success_factors"]:
        if factor["quoted_phrase"] not in original_text:
            issues.append(f"quoted_phrase not in body: {factor['quoted_phrase']}")
    if draft["category_inferred"]["slug"] not in ALLOWED_SLUGS + ["etc"]:
        issues.append(f"invalid slug: {draft['category_inferred']['slug']}")
    return issues
```

---

## 8. AI-15 (에이전트 B) 연계

- `confidence_score < 0.7` → 에이전트 B 재생성 트리거
- `validate_draft()` issues 발견 → 즉시 fail (재생성 또는 제외)
- 재생성 1회 후에도 미달 시 → 해당 case_id는 `success_analysis_drafts.json`에서 제외 + 로그

---

## 9. PM-12 explanation 연계

`sources` 필드가 [PM-12 SimilarCaseExplanation](PM-12-분석%20근거%20모달%20(Explainability%20Tooltip)%20기획.md) 스키마와 호환되도록 설계.
사용자가 분석글 옆 "?" 클릭 시 sources.excerpt + link 노출.

---

## 10. dry-run 검증 체크리스트 (10건)

- [ ] 카테고리 추론 정확도 (사람 검토 — etc 케이스 7개 분야 분류 성공률)
- [ ] success_factors quoted_phrase 본문 일치 100%
- [ ] 톤 일관성 (친근체 / 단정 표현 없음)
- [ ] 분량 적정 (factor 60~120자 / difference 150~250자)
- [ ] LangSmith 트레이스 정상 (재시도 횟수, 비용)
- [ ] confidence_score 분포 합리적

검증 통과 시 → 50건 전체 실행.

---

## 11. 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|---|---|---|---|
| v1 | 2026-06-02 | 오혜림 | 초안 작성 (dry-run 10건 기준) |
