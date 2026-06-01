# AI Task 티켓3 (W3 고도화)

| 항목 | 값 |
|---|---|
| 주담당과정 | 생성AI |
| 진행 주차 | 고도화 3 |
| 진행 기간 | 2026-06-01 ~ 2026-06-07 |
| 시작일 | 6월 1일 |
| 마감일 | 6월 7일 |
| 담당자 | 오혜림 |
| 진행상태 | 진행 중 |
| 우선순위 | 매우 높음 |
| 전달 파트 | BE |

---

## 작업 안내

> 💡 W3는 **AI 데이터 가공 → BE 그래프/검색 연동의 핵심 주차**입니다.
> 월요일 밤 / 화요일 밤까지 JSON 포맷 확정이 BE 작업 일정에 직결됩니다.
> 또한 **에이전트 A·B 구현으로 환각 방지 + 글 작성 보조**의 첫 단추를 끼웁니다.

---

## 상세 마감 일정

| 티켓 | 작업 | 시작일 | 마감일 | 전달 대상 | 산출물 | 우선순위 |
|---|---|---|---|---|---|---|
| **AI-12** | 실패패턴 그래프 데이터 가공 + JSON 포맷 | 6/1(월) 오전 | 6/1(월) 밤 | → BE-22 + BE-29 | failure_pattern.json + 가공 스크립트 | 🔴 P0 |
| **AI-13** | 실패 시점 분포 데이터 가공 + JSON 포맷 | 6/2(화) 오전 | 6/2(화) 밤 | → BE-22 + BE-29 | failure_timing.json + 스크립트 | 🔴 P0 |
| **AI-14** | 성공사례 AI 분석글 초안 작성 | 6/3(수) 오전 | 6/5(금) 밤 | → BE / 자체 보관 | 분석글 N건 JSON + 프롬프트 v1 | 🔴 P0 |
| **AI-15** | 에이전트 B 자기검증 루프 구현 | 6/4(목) 오전 | 6/6(금) 밤 | → BE 연동 | agent_b.py + 테스트 결과 | 🔴 P0 |
| **AI-16** | 에이전트 A AI 로직 설계 + API 스펙 | 6/2(화) 오후 | 6/3(수) 밤 | → BE | API 명세 + 프롬프트 초안 | 🔴 P0 |
| **AI-17** | PM-12 explanation 메타 추가 (분석글 + 유사사례) | 6/5(금) 오후 | 6/7(일) 밤 | → BE / W4 인계 | analysis/similar_case explanation 필드 적용 | 🟡 P1 |

---

## 마감일별 정리

| 마감일 | 티켓 |
|---|---|
| 6/1(월) 밤 | AI-12 (실패패턴 그래프 JSON) |
| 6/2(화) 밤 | AI-13 (실패 시점 분포 JSON) |
| 6/3(수) 밤 | AI-16 (에이전트 A 로직 + API 스펙) |
| 6/5(금) 밤 | AI-14 (성공사례 분석글 초안) |
| 6/6(금) 밤 | AI-15 (에이전트 B 자기검증 루프) |
| 6/7(일) 밤 | AI-17 (PM-12 explanation 메타) |

---

## 일자별 진행 일정

| 날짜 | 작업 |
|---|---|
| 6/1(월) | AI-12 시작 + 완료 → BE 즉시 전달 |
| 6/2(화) | AI-13 완료 → BE 전달 / AI-16 시작 |
| 6/3(수) | AI-16 완료 → BE 전달 / AI-14 시작 (분석글 초안) |
| 6/4(목) | AI-14 진행 (Claude API 호출 + 결과 검증) / AI-15 시작 (에이전트 B) |
| 6/5(금) | AI-14 마감 / AI-17 시작 |
| 6/6(금) | AI-15 마감 / AI-17 진행 |
| 6/7(일) | AI-17 마감 + W4 인계 정리 |

---

## 의존성 관계

```
AI-08 통합 정제 데이터셋 (351건, W2 완료)
    ↓
AI-12 (실패패턴 JSON) ──┬──→ BE-22 통계 API + TOP3 차트
                       └──→ BE-29 실패패턴 그래프 FE
AI-13 (시점 분포 JSON) ─┬──→ BE-22 통계 API
                       └──→ BE-29 시점 분포 차트 FE
    ↓
PM-14 (분석글 기획) ──→ AI-14 (분석글 초안)
                            ↓
                       AI-17 (explanation 메타 — 분석글 + 유사사례 중심)
                            ↓
                       AI-15 (에이전트 B 자기검증 — 환각 방지)

AI-16 (에이전트 A 로직) ──→ BE-27 (에이전트 A API)
```

---

## 작업 내용

### AI-12 — 실패패턴 그래프 데이터 가공 + JSON 포맷

- **마감**: 6/1(월) 밤
- **우선순위**: 🔴 P0
- **산출물**:
  - `ai/data/failure_pattern.json` (BE-22 + BE-29 입력용)
  - `ai/pipeline/20_aggregate_failure_pattern.py`
- **의존성**: AI-08 integrated_success_sample.csv (351건)
- **전달**: BE-22 (통계 API + TOP3) + BE-29 (실패패턴 그래프 FE)

#### 작업 설명

"나와 같은 실수를 한 사람 X%" 시각화를 위한 데이터 가공. 업종별로 실패 패턴 빈도를 집계해서 JSON으로 출력.

#### 출력 JSON 예시

```json
{
  "version": "1.0",
  "generated_at": "2026-06-01T22:00:00+09:00",
  "categories": {
    "online-commerce": {
      "total": 16,
      "patterns": [
        { "label": "마케팅 부족", "count": 7, "percent": 43.8 },
        { "label": "수익 구조 이해 부족", "count": 5, "percent": 31.3 },
        { "label": "재고 관리 실패", "count": 4, "percent": 25.0 }
      ]
    },
    "content-sns": { ... }
  }
}
```

#### DoD

- [ ] 카테고리별 실패 패턴 집계 로직 (TOP 5)
- [ ] 비율 계산 (전체 + 카테고리별)
- [ ] JSON 출력 + BE 합의 (BE-22)
- [ ] BE에 디스코드 전달

---

### AI-13 — 실패 시점 분포 데이터 가공 + JSON 포맷

- **마감**: 6/2(화) 밤
- **우선순위**: 🔴 P0
- **산출물**:
  - `ai/data/failure_timing.json`
  - `ai/pipeline/21_aggregate_failure_timing.py`
- **의존성**: AI-12 동일
- **전달**: BE-22 (통계 API) + BE-29 (시점 분포 차트 FE)

#### 작업 설명

업종별로 몇 개월차에 실패 경험을 가장 많이 보고하는지 분포 데이터 가공. PDF 예시 "스마트스토어 실패 시점 분포" 형태.

#### 출력 JSON 예시

```json
{
  "categories": {
    "online-commerce": {
      "total": 16,
      "distribution": [
        { "month": 1, "count": 2, "percent": 12.5 },
        { "month": 2, "count": 5, "percent": 31.3 },
        { "month": 3, "count": 7, "percent": 43.8 },
        { "month": 4, "count": 2, "percent": 12.5 }
      ],
      "peak_month": 3
    }
  }
}
```

#### DoD

- [ ] 카테고리별 1~12개월차 분포 집계
- [ ] peak_month 표시
- [ ] JSON 출력 + BE 전달
- [ ] PDF 예시 형태와 일치 검증

---

### AI-14 — 성공사례 AI 분석글 초안 작성

- **마감**: 6/5(금) 밤
- **우선순위**: 🔴 P0
- **산출물**:
  - `ai/data/success_analysis_drafts.json` (분석글 N건)
  - `ai/prompts/AI-14-success_analysis_v1.md` (프롬프트)
- **의존성**: PM-14 (분석글 기획) / AI-10 labeled_success_sample.csv

#### 작업 설명

success 라벨 글 183건 중 본문 보유 + 상위 점수 30~50건 선정해서 Claude로 AI 분석글 초안 작성. 항목 3종: 업종 / 성공요인 / 나와의 차이점.

#### DoD

- [ ] 분석 대상 30~50건 선정 (success + 본문 500자+ + 카테고리 다양성)
- [ ] 프롬프트 v1 작성 (PM-14 기획 반영)
- [ ] Claude Sonnet 호출 → 분석글 생성
- [ ] 결과 JSON 저장 (case_id / 업종 / 성공요인 / 나와의 차이점 + explanation)
- [ ] 비용 모니터링 (LangSmith 트레이싱)

---

### AI-15 — 에이전트 B 리포트 자기검증 루프 구현

- **마감**: 6/6(금) 밤
- **우선순위**: 🔴 P0
- **산출물**:
  - `ai/server/agent_b.py`
  - `ai/server/tests/test_agent_b.py`
- **의존성**: AI-04 시스템 프롬프트 + AI-14 분석글 결과

#### 작업 설명

PDF 명세: **신뢰도 < 0.7 발동 / 재생성 1회 / 결과 캐싱**. AI 분석 결과의 case_id 인용 / 유사도 / 카테고리 분류 정확도 평가 → 기준 미달 시 재검색·재생성. 환각 방지 핵심 안전장치.

#### DoD

- [ ] 신뢰도 평가 로직 (유사도 + 업종 분류 + case_id 인용 검증)
- [ ] 신뢰도 < 0.7 → 재생성 트리거
- [ ] 재생성 1회 후에도 미달 시 Plan B fallback
- [ ] 결과 캐싱 (analysis_id 기준)
- [ ] 단위 테스트 5종 (정상 / 신뢰도 미달 / 재생성 / 캐시 hit / fallback)

---

### AI-16 — 에이전트 A 글 작성 보조 AI 로직 설계 + API 스펙

- **마감**: 6/3(수) 밤
- **우선순위**: 🔴 P0
- **산출물**:
  - `ai/specs/AI-16-에이전트 A 로직 설계.md`
  - `ai/prompts/AI-16-agent_a_v1.md`
- **의존성**: AI-09 (가이드형 글쓰기 예시 49개)

#### 작업 설명

사용자가 글 작성 시 초안 분석 → "부족한 정보" 감지 → 질문 카드로 보완 정보 수집. PDF 명세 기반.

#### DoD

- [ ] 초안 분석 로직 (어떤 정보가 부족한지)
- [ ] 질문 생성 프롬프트 (3~5개 질문)
- [ ] BE-27 API 스펙 (request / response 형식)
- [ ] BE 인계 (디스코드)

---

### AI-17 — PM-12 explanation 메타 추가

- **마감**: 6/7(일) 밤
- **우선순위**: 🟡 P1
- **산출물**:
  - `ai/server/llm_analyzer.py`에 explanation 필드 추가
  - 분석 + 유사 사례 API 응답에 explanation 포함
- **의존성**: PM-12 v2 스키마 / AI-14 분석글 / AI-15 에이전트 B
- **적용 범위**: AI 분석글 + 유사사례 매칭 (PM-12 P0 2곳). BE-22/BE-29 통계 그래프는 사실 데이터라 explanation 필요 없음 (옵션)

#### 작업 설명

PM-12 v2에서 합의한 `AnalysisExplanation` + `SimilarCaseExplanation` 필드를 AI 응답에 포함. W4 모달 구현 진입 가능하도록.

#### DoD

- [ ] `AnalysisExplanation` 필드 구현 (input_used / matched_patterns / similar_cases_used / is_verified / _debug)
- [ ] `SimilarCaseExplanation` 필드 구현 (similarity_score / matched_keywords / category_match / source / case_id / _debug)
- [ ] AI-14 분석글 결과에 explanation 적용
- [ ] BE-23 (히스토리) / BE-24 (검색) API 응답 형식 점검 — BE-22/29 통계 그래프엔 미적용 (사실 데이터)

---

## 작업 완료

> 💡 여기에 작업 완료한 내용 작성

(빈 칸 — 작업 진행 시 채움)
