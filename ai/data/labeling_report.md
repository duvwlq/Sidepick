# AI-10 라벨링 리포트

**작성일**: 2026-05-27
**입력**: `ai/data/integrated_success_sample.csv` (351건)
**산출물**: `ai/data/labeled_success_sample.csv` + `test_scenarios_50.csv`
**방식**: 휴리스틱 (W4 시나리오 테스트에서 Sonnet으로 정확도 검증 예정)

## 1. 라벨 분포

| 라벨 | 건수 | 비율 |
|---|---|---|
| `success` | 183 | 52.1% |
| `ambiguous` | 133 | 37.9% |
| `fail` | 35 | 10.0% |

## 2. 카테고리 × 라벨 매트릭스

| category_slug | success | ambiguous | fail | total |
|---|---|---|---|---|
| `etc` | 145 | 107 | 32 | 284 |
| `content-sns` | 17 | 18 | 3 | 38 |
| `online-commerce` | 12 | 4 | 0 | 16 |
| `digital-products` | 5 | 3 | 0 | 8 |
| `platform-labor` | 4 | 1 | 0 | 5 |

## 3. 50개 시나리오 테스트셋 (W4 환각 측정용)

**구성**: success 30 / ambiguous 15 / fail 5 (본문 200자 이상만, 카테고리 라운드 로빈)

- 실제 추출 건수: 50
- 라벨 분포: `{'success': 30, 'ambiguous': 15, 'fail': 5}`
- 카테고리 분포: `{'content-sns': 16, 'etc': 17, 'platform-labor': 3, 'online-commerce': 8, 'digital-products': 6}`

## 4. 휴리스틱 룰 (참고)

### fail 판정
- 광고 키워드 4+ (severe ad)
- offtopic 키워드 3+
- 본문 < 100자 AND description < 80자
- 부업 키워드 ≤ 1
- 푸념 표현(`포기했|그만뒀|손해|실패|적자|망했`) + 성공 표현 없음

### success 판정
- 본문 ≥ 100자 + 성공 패턴 + 부업 키워드 5+ + 광고 의심 없음 (광고 키워드 < 2)
- 또는 본문 + 성공 패턴 + 부업 키워드 3+ + 푸념 없음

### ambiguous
- 위 둘 다 아닌 경계선 케이스

## 5. 다음 단계 (W4 인계)

- W4 50개 시나리오 테스트 시 `test_scenarios_50.csv` 활용
- Sonnet으로 같은 케이스 분류 → 휴리스틱 vs LLM 정확도 비교
- 정확도 차이 큰 패턴 발견 시 휴리스틱 룰 보강
- PD 설문 30건 수령 시 18번 재실행 후 19번도 재실행 권장