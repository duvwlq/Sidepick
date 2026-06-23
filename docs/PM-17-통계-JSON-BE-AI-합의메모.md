# PM-17 — W3 통계 데이터 JSON 포맷 BE/AI 합의 메모

**작성일**: 2026-06-10 (6/2 마감 지연 — W3 마감 후 BE 회신 받아 합의 확정)
**작성자**: 오혜림 (팀장)
**티켓**: PM-17
**상태**: ✅ 합의 완료 (BE 회신 기준)

---

## 1. 합의 핵심

| 항목 | 결정 |
|---|---|
| **AI-12 JSON 포맷** | `failure_pattern.json` v1.1 — `categories[slug].patterns[]` TOP 5 |
| **AI-13 JSON 포맷** | `failure_timing.json` v1.1 — `categories[slug].distribution[]` 5단계 bucket + `peak_bucket` |
| **시점 분포 형식** | **bucket + label + order** (month X) — BE 동의 ✅ |
| **sufficient_data 룰** | 카테고리 n<10이면 차트 X, "데이터 수집 중" 카드 — BE 동의 ✅ |
| **카테고리 슬러그 매핑** | PM-03 v1.6 7개 부업 분야 + etc — 픽플리 한글 → slug 매핑 코드 내부에 보유 |
| **데이터 소스** | 픽플리 100건 (현재) / W3 후속 합본은 불필요 판정 (AI-19 재라벨링 결과) |
| **BE-22 + BE-29 W3 완료** | ✅ BE 회신 (2026-06-10) — 통계 API + 그래프 컴포넌트 둘 다 W3 마감 |

## 2. DoD 점검

### 2.1 ✅ AI-12 JSON 포맷 확정 (BE-22 + BE-29 입력)

```json
{
  "version": "1.1",
  "display_policy": { "min_sample_size": 10, "insufficient_message": "..." },
  "categories": {
    "online-commerce": {
      "label_ko": "온라인 판매·이커머스",
      "total": 12,
      "sufficient_data": true,
      "display_status": "ok",
      "patterns": [
        { "label": "시장 조사 부족", "count": 6, "percent": 50.0 },
        ...
      ]
    },
    ...
  }
}
```

### 2.2 ✅ AI-13 JSON 포맷 확정

```json
{
  "version": "1.1",
  "buckets": [
    { "bucket": "under-1m", "label": "1개월 미만", "order": 1 },
    { "bucket": "1-3m", "label": "1~3개월", "order": 2 },
    { "bucket": "3-6m", "label": "3~6개월", "order": 3 },
    { "bucket": "6-12m", "label": "6개월~1년", "order": 4 },
    { "bucket": "over-1y", "label": "1년 이상", "order": 5 }
  ],
  "categories": {
    "online-commerce": {
      "label_ko": "온라인 판매·이커머스",
      "total": 12,
      "sufficient_data": true,
      "distribution": [
        { "bucket": "under-1m", "label": "1개월 미만", "count": 1, "percent": 8.3 },
        ...
      ],
      "peak_bucket": "over-1y"
    }
  }
}
```

### 2.3 ⚠️ 차트 라이브러리 미확정

- BE/FE 선택 사항으로 남김 (BE 회신에 언급 없음)
- 후보: Recharts / Chart.js / D3 / Visx
- W4 BE-29 작업 시 결정

### 2.4 ❓ PD-16 디자인 정합

- PD-16 회신 대기 중 (사용자 PD에 정정 메시지 전달 — 351건 → 100건 + 데이터 수집 중 카드 요청)
- PD 디자인 도착 후 BE-29 작업 시 정합성 확인

### 2.5 ✅ BE/PD/AI 합의 공유

- **BE**: 종합 인계 메시지 + 추가 결정 안내 + BE-29 W4 이월 안내 + AI-16 v1.1 인계 (사용자 발송 완료)
- BE 회신 확인 (2026-06-10): bucket OK / sufficient_data OK / BE-27 골격 가능

---

## 3. 산출물

- 본 문서 (`docs/PM-17-통계-JSON-BE-AI-합의메모.md`)
- `ai/data/failure_pattern.json` v1.1 (push `1ab4a48`)
- `ai/data/failure_timing.json` v1.1 (push `1ab4a48`)
- `ai/pipeline/20_aggregate_failure_pattern.py` / `21_aggregate_failure_timing.py`
- BE 통합 인계 메시지 (`docs/_local/BE-W3-종합-인계-메시지.md` 등)

---

## 4. 변경 이력

| 버전 | 날짜 | 변경 |
|---|---|---|
| v1 | 2026-06-10 | 잠정 작성 — BE 회신 받아 합의 정리 |
