# archive_ai_a/ — AI-A 원본 작업물 보관소

중도하차한 AI-A 팀원의 작업물을 **히스토리 보존 목적**으로 통째 보관.

## ⚠️ 직접 사용하지 마세요

- 정리·재가공된 사용본은 다음 위치에 있습니다:
  - 데이터: [`../data/`](../data/)
  - 파이프라인: [`../pipeline/`](../pipeline/)
  - 추천기: [`../recommender/`](../recommender/)
- 이 폴더는 **참고용·복원용**입니다.

## 📂 내용

```
archive_ai_a/
├── crawler/             원본 수집·필터링 코드 (T5 폐기 전 버전)
└── data/                중간 산출물 데이터 (everytime, naver_cafe 등 포함)
```

## 🗒️ 컨텍스트

- AI-A는 처음 5명 팀에서 데이터 수집·T5 학습 담당이었음
- 중도하차 후 작업물이 팀장에게 흡수됨
- T5 모델 학습은 폐기 결정 (강사 피드백 + 데이터 부족)
- 이후 Claude API + SBERT/FAISS 조합으로 노선 변경

## 🌐 원본 레포

AI-A가 작업하던 별도 레포:
[yumenikkidiary/sidejob-data-collection](https://github.com/yumenikkidiary/sidejob-data-collection)

→ 위 레포의 최신본 일부를 골라서 [`../pipeline/`](../pipeline/), [`../recommender/`](../recommender/), [`../data/`](../data/)에 정리해두었음.
