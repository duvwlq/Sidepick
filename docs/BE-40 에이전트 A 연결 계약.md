# BE-40 에이전트 A 연결 계약

## 목적

이 문서는 W4 기준 `에이전트 A FE+BE 완성`을 위한 현재 구현 계약을 정리한다.
AI 팀 산출물과 현재 백엔드 코드를 기준으로, 질문 카드 생성과 Plan B fallback을 FE/BE 연결 가능한 수준으로 고정한다.

---

## 현재 기준

- 디자인/기획 근거: `PD-22`, `PM-19`
- AI 근거: `AI-20`, `AI-22`
- 현재 백엔드 코드:
  - `AgentAService`가 템플릿 기반 질문 카드를 반환
  - draft body 길이에 따라 질문 카드 노출 여부 결정
  - fallback 메시지 반환 가능

---

## 범위

### 포함

- 글 작성 마지막 단계에서 질문 카드 요청
- 질문 카드 3~5개 노출
- input type 4종 처리
- fallback 메시지 노출

### 제외

- AI 서버 실연동 고도화
- SSE/streaming
- 질문 답변 장기 저장 모델 추가

---

## 현재 백엔드 계약

권장 엔드포인트 기준:

- `POST /api/agents/a/questions`

Request:

```json
{
  "draft": {
    "categorySlug": "commerce",
    "body": "광고를 돌렸는데 반응이 거의 없었고 고객층도 불분명했습니다."
  }
}
```

Response:

```json
{
  "status": "ok",
  "needsQuestions": true,
  "questions": [
    {
      "slot": "goal",
      "question": "이번 글에서 얻고 싶은 결과는 무엇인가요?",
      "inputType": "text",
      "options": null,
      "required": true,
      "hint": "예: 실패 원인 분석, 방향 점검"
    }
  ],
  "meta": {
    "estimatedInputTokens": 24,
    "estimatedOutputTokens": 31,
    "latencyMs": 42,
    "usedTemplate": true
  },
  "fallbackMessage": null
}
```

Fallback response:

```json
{
  "status": "fallback",
  "needsQuestions": false,
  "questions": [],
  "meta": {
    "estimatedInputTokens": 0,
    "estimatedOutputTokens": 0,
    "latencyMs": 10000,
    "usedTemplate": true
  },
  "fallbackMessage": "질문 카드를 생성하지 못했어요. 그대로 저장하시거나 다시 시도해주세요."
}
```

---

## FE 처리 규칙

- `needsQuestions=true`면 질문 카드 노출
- `needsQuestions=false`면 다음 단계로 바로 진행
- `status=fallback`이면 카드 생성 대신 fallback UI 표시

지원 input type:

- `text`
- `select`
- `number`
- `tag`

---

## 질문 카드 노출 규칙

- 본문 길이 짧을수록 질문 카드 수 증가
- 본문이 충분히 길면 질문 카드 없이 통과 가능
- `required=false` 카드는 스킵 버튼 허용

---

## 완료 기준

- FE가 현재 백엔드 응답 shape로 질문 카드를 안정적으로 렌더링한다
- fallback 응답 시 저장/재시도 UX가 깨지지 않는다
- 질문 카드 답변을 본문에 병합하는 FE 흐름이 정리된다
