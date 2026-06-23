# BE-41 성공사례 MVP 계약

## 목적

이 문서는 W4 기준 `성공사례 BE+FE`를 구현하기 위한 MVP 계약 문서다.
현재 보유한 `clean_cases`와 성공사례 분석 초안을 기준으로, 리스트/상세/API를 구현 가능한 수준으로 정리한다.

---

## 현재 기준

- 데이터 근거: `AI-18`, `AI-19`, `AI-19-v2`
- 현재 저장소 자산:
  - `server/import-data/success_cases_seed_sample.csv`
  - AI 성공사례 분석 초안 존재
- 현재 백엔드 상태:
  - 실패 경험 상세에서 연관 성공사례 조회 API는 존재
  - 독립 성공사례 리스트/상세 API는 미구현

---

## W4 범위

### 포함

- 성공사례 리스트 조회
- 성공사례 상세 조회
- 카테고리 필터
- FE 카드 렌더링

### 제외

- 관리자 성공사례 등록 UI
- 성공사례 작성 기능
- 검색 고도화

---

## 데이터 기준

이번 범위의 데이터 소스는 아래 우선순위를 따른다.

1. `clean_cases` 기반 정제 성공사례
2. 성공사례 분석 초안
3. 필요한 경우 기존 seed sample 보조 사용

카테고리 키는 slug 기준으로 맞춘다.

- `commerce`
- `content-sns`
- `digital-product`
- `platform-labor`
- `talent`
- `investment`
- `offline`
- `etc`

---

## API 계약

### 1. 성공사례 리스트

- `GET /api/success-cases`

Query:

- `category`: optional
- `page`: optional
- `size`: optional

Response:

```json
{
  "items": [
    {
      "id": 101,
      "caseId": "success_101",
      "title": "초기 타겟 재설정 후 매출을 만든 사례",
      "summary": "고객층을 좁히고 채널을 재정비하면서 반응을 만든 사례입니다.",
      "category": {
        "slug": "commerce",
        "label": "온라인 판매/이커머스"
      },
      "source": "cafe",
      "thumbnailUrl": null
    }
  ],
  "pagination": {
    "page": 0,
    "size": 20,
    "totalElements": 32,
    "totalPages": 2,
    "hasNext": true
  }
}
```

### 2. 성공사례 상세

- `GET /api/success-cases/{successCaseId}`

Response:

```json
{
  "id": 101,
  "caseId": "success_101",
  "title": "초기 타겟 재설정 후 매출을 만든 사례",
  "summary": "고객층을 좁히고 채널을 재정비하면서 반응을 만든 사례입니다.",
  "content": "원문 또는 정리된 본문",
  "category": {
    "slug": "commerce",
    "label": "온라인 판매/이커머스"
  },
  "source": {
    "type": "cafe",
    "url": "https://..."
  },
  "analysis": {
    "structuredSummary": "성공 요약",
    "successFactors": ["타겟 재정의", "채널 재정비"],
    "confidenceScore": 0.84
  }
}
```

---

## FE 표시 규칙

### 리스트 카드

- 제목
- 2~3줄 요약
- 카테고리
- 소스 배지

### 상세

- 제목
- 본문
- AI 분석 요약
- 성공 요인
- 원문 출처 링크

---

## 구현 순서

1. 성공사례 read 모델 정의
2. 리스트/상세 API 추가
3. FE 카드/상세 연결
4. 카테고리 필터 연결

---

## 완료 기준

- 카테고리 필터 포함 성공사례 리스트가 조회된다
- 상세에서 본문/분석 요약/출처를 확인할 수 있다
- FE 카드와 상세가 현재 데이터셋 기준으로 정상 렌더링된다
