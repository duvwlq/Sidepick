# PM-08 — BE W1 수정 요청 6건 검수 결과

**작성일**: 2026-05-27
**작성자**: 오혜림 (팀장)
**전달 대상**: BE (정근원), 팀 디스코드
**티켓**: PM-08
**의존성**: W1 BE 메시지 6건 전달 완료
**관련 commit (BE)**: `09ea72b feat: sync backend category and guardrail specs` (2026-05-25)

---

## 1. 검수 결과 요약

✅ **BE가 5/25에 6건 모두 처리 완료**. PM-08 검수에서 12건 정합성 이슈 발견 → PM-03 v1.3 / 서비스 정책 v1.3 업데이트로 해결.

| # | 요청 항목 | 우선순위 | 처리 결과 | 검수 |
|---|---|---|---|---|
| 1 | `AGENT_C_PROMPT_PATH` 환경변수 | 🔴 P0 | `PromptLoader.java` (신규) | ✅ |
| 2 | `business_categories` type 컬럼 + 16개 INSERT SQL | 🔴 P0 | `V6__expand_business_categories_with_type.sql` + `002__...update.sql` | ✅ |
| 3 | `SPECIAL_LABELS` + 카테고리명 정합화 | 🔴 P0 | `guardrail.py` + `test_guardrail.py` (신규) | ✅ |
| 4 | Swagger `/api` prefix | 🟡 P1 | `application.yml` 변경 | ✅ |
| 5 | 카테고리 slug 16개 매핑 | 🟡 P1 | `CategoryMapper.java` (신규) | ✅ |
| 6 | 성공사례 이중 적재 명세 | 🟡 P1 | 추정 — feature/backend에서 미확인 | ⚠️ |

---

## 2. 발견된 정합성 이슈 (PM-03 v1.2 ↔ BE)

### 2.1 slug 불일치 (9건)

PM-03 v1.2가 정한 slug가 짧고 모호. BE가 더 명확하게 정의 → **PM-03이 BE에 맞춤** (v1.3).

| # | 한글명 | v1.2 slug | v1.3 slug (BE 채택) |
|---|---|---|---|
| 1 | 온라인 판매·이커머스 | `commerce` | `online-commerce` |
| 3 | 디지털·지식판매 | `digital-product` | `digital-products` |
| 5 | 재능·프리랜서 | `talent` | `talent-freelance` |
| 7 | 오프라인 부업 | `offline` | `offline-sidejob` |
| 8 | 부업 시작 전 공통 | `pre-start` | `before-start` |
| 9 | 세금·사업자 | `tax` | `tax-business` |
| 10 | 본업 + 부업 | `work-balance` | `work-plus-sidejob` |
| 13 | 멘탈 관리·번아웃 | `mental` | `mental-care` |
| 14 | 법률·계약 | `legal` | `legal-contract` |

### 2.2 한글명 띄어쓰기 불일치 (3건)

| # | v1.2 한글명 | v1.3 한글명 (BE 채택, 한국어 규범 준수) |
|---|---|---|
| 8 | 부업 시작전 공통 | 부업 시작 전 공통 |
| 10 | 본업+부업 | 본업 + 부업 |
| 13 | 멘탈관리·번아웃 | 멘탈 관리·번아웃 |

---

## 3. 후속 조치 (W3 인계 또는 즉시 처리)

- [x] **PM-03 v1.3** — slug 9개 + 한글명 3개 업데이트 (커밋: 본 PR)
- [x] **`docs/사이드픽-서비스-정책.md`** — 한글명 3개 동기화
- [ ] **AI-04 / AI-05 enum 검토** — 부업 분야 7개만 영향, 횡단 9개는 enum 미포함이라 영향 없음 → 추가 작업 불필요
- [ ] **BE-01 성공사례 이중 적재 로직 명세 (P1 #6)** — feature/backend에 명세 commit 확인 필요. BE에 추가 확인 요청.
- [ ] **W3 메모리 등록** — 카테고리 정합성 검증 자동화 (Python 스크립트로 SQL ↔ PM-03 매칭)

---

## 4. BE 디스코드 공유 메시지 (참고)

```
[PM-08 BE W1 수정 요청 6건 검수 완료]

5/25 BE commit 09ea72b 확인. P0 3건 + P1 3건 다 처리됐어요. 감사합니다!

정합성 검수 중 12건 불일치 발견 → PM-03 v1.3 / 서비스 정책으로 BE에 맞춰 정리했습니다.
(slug 9개 + 한글명 띄어쓰기 3개. 대부분 BE가 더 명확 + 한국어 규범 준수라 채택)

상세: ai/docs/PM-08-BE W1 수정 요청 6건 검수 메모.md

확인 요청 1건: BE-01 성공사례 이중 적재 로직 명세는 어디에 정리됐는지 알려주세요.
```
