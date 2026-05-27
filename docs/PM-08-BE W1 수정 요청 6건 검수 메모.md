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

| # | 요청 항목 | 우선순위 | 처리 결과 (BE 답변 5/27) | 검수 |
|---|---|---|---|---|
| 1 | `AGENT_C_PROMPT_PATH` 환경변수 | 🔴 P0 | `.env.example` L49 + `docs/BE-04 환경 변수 명세.md` L79 + `PromptLoader.java` | ✅ |
| 2 | `business_categories` type 컬럼 + 16개 INSERT SQL | 🔴 P0 | `V6__expand_business_categories_with_type.sql` + `docs/BE-01 마이그레이션 스크립트 초안.sql` | ✅ |
| 3 | `SPECIAL_LABELS` 3종 정합화 | 🔴 P0 | `docs/BE-06 가드레일 인프라 설계 문서.md` L149 + `guardrail.py` | ✅ |
| 4 | Swagger `/api` prefix | 🟡 P1 | `docs/BE-03 Swagger 초안.yaml` L9 + `OpenApiConfig.java` + 통합 테스트 | ✅ |
| 5 | 카테고리 slug 16개 매핑 | 🟡 P1 | `CategoryMapper.java` + `docs/BE-03 API 명세 문서.md` (slug 입력 기준) | ✅ |
| 6 | 성공사례 이중 적재 명세 | 🟡 P1 | **`docs/BE-21 성공사례 이중 적재 로직 명세.md` L69** (success_cases insert + FAISS add 동시) | ✅ |
| (보너스) | 카테고리명 "디지털·지식판매" 통일 | — | `CategoryMapper.java` L13 + V6 SQL L8 + BE-06 L78 | ✅ |

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
- [x] **AI-04 / AI-05 enum 검토** — 부업 분야 7개만 영향, 횡단 9개는 enum 미포함이라 영향 없음 → 추가 작업 불필요
- [x] **BE-21 성공사례 이중 적재 로직 명세** — BE 답변(5/27) `codex/continue-on-laptop` 브랜치 `docs/BE-21 성공사례 이중 적재 로직 명세.md` L69 확인. **성공사례 등록 시 `success_cases` insert + `FAISS add(type="success")` 동시 처리 원칙 명시 완료**.
- [ ] **W3 메모리 등록** — 카테고리 정합성 검증 자동화 (Python 스크립트로 SQL ↔ PM-03 매칭) — 옵션
- [ ] **BE 테스트 실행 확인** — BE 답변(5/27)에 "환경에 Maven/Docker 없어 실제 실행 미진행" 명시. 다음 BE 셋업 시 테스트 통과 확인 필요

---

## 4. PM-08 최종 결과 — ✅ 완료

- BE 답변 5/27 수령. **6건 + 보너스 1건 모두 위치 명시되어 확인 완료**.
- PM-03 v1.3 / 서비스 정책 v1.3 정합화 commit.
- 미완 항목 없음. BE 테스트 실행 확인만 다음 셋업 시 확인 필요.
