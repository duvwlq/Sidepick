# BE-37 알림 MVP 계약

## 목적

이 문서는 W4 기준 `알림` 범위를 빠르게 착수하기 위한 구현 계약 문서다.
현재 단계에서는 댓글 전체 기능보다 `좋아요 기반 알림 + 읽음 처리 + 알림 진입 UI`를 우선 범위로 본다.

---

## 현재 기준

- FE 디자인 근거: `PD-32`
- 기존 광역 API 문서: `BE-03 API 명세 문서`
- 현재 구현 상태:
  - 홈 상단 알림 버튼은 아직 실데이터 연결 전
  - 알림 전용 API/테이블은 미구현

---

## W4 범위

### 포함

- `notifications` 저장소
- 알림 목록 조회
- 알림 읽음 처리
- 좋아요 발생 시 알림 생성
- 읽음/안읽음 상태 표시
- 빈 상태 처리

### 제외

- 댓글 CRUD 전체
- 대댓글 알림
- 실시간 push / websocket
- 알림 설정 화면

댓글은 별도 범위 확정 전까지 이번 티켓 기본 범위에서 제외한다.

---

## 데이터 모델 초안

테이블: `notifications`

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `id` | bigint | PK |
| `user_id` | bigint | 알림 수신자 |
| `actor_user_id` | bigint | 알림 발생 사용자 |
| `type` | varchar | 현재는 `LIKE_CREATED` 우선 |
| `target_type` | varchar | `EXPERIENCE` |
| `target_id` | bigint | 경험 ID |
| `message` | varchar | FE 즉시 렌더링용 문구 |
| `is_read` | boolean | 읽음 여부 |
| `created_at` | datetime | 생성 시각 |

권장 인덱스:

- `(user_id, is_read, created_at desc)`
- `(target_type, target_id)`

---

## 알림 발생 규칙

### 1. 좋아요 알림

- 누군가 내 경험에 좋아요를 누르면 알림 생성
- 자기 글에 자기 자신이 누른 경우 알림 생성 안 함
- 같은 사용자가 같은 경험에 재좋아요해도 중복 알림 생성 안 함

### 2. 읽음 처리

- 사용자가 알림 목록 진입 후 개별 읽음 처리 가능
- 일괄 읽음은 이번 범위 제외

---

## API 계약

### 1. 알림 목록 조회

- `GET /api/notifications`

Query:

- `read`: optional (`true` / `false`)

Response:

```json
{
  "items": [
    {
      "id": 1,
      "type": "LIKE_CREATED",
      "message": "ownerUser님의 글에 someone님이 공감했어요.",
      "isRead": false,
      "targetType": "EXPERIENCE",
      "targetId": 45,
      "actor": {
        "id": 7,
        "nickname": "someone",
        "profileImageUrl": "https://..."
      },
      "createdAt": "2026-06-15T10:30:00"
    }
  ]
}
```

### 2. 알림 읽음 처리

- `PATCH /api/notifications/{notificationId}/read`

Response:

```json
{
  "id": 1,
  "isRead": true
}
```

### 3. unread 개수 노출 방식

이번 범위에서는 별도 `/unread-count`를 만들지 않고, 홈 진입 시 알림 목록 또는 홈 피드 응답 확장 여부를 구현 단계에서 결정한다.
단, MVP 우선순위는 `알림 목록 + 읽음 처리`다.

---

## FE 연결 규칙

- 홈 상단 알림 아이콘 클릭 시 알림 페이지 이동
- 알림 카드 클릭 시 해당 경험 상세로 이동
- `isRead=false`는 강조 스타일 적용
- 데이터가 비어 있으면 빈 상태 문구 표시

빈 상태 기본 문구:

- `아직 받은 알림이 없어요.`

---

## 구현 순서

1. `notifications` 엔티티/리포지토리 추가
2. 목록 조회/읽음 처리 API 추가
3. 좋아요 저장 로직에 알림 생성 연결
4. FE 알림 페이지/API 연결

---

## 완료 기준

- 좋아요 발생 시 알림이 저장된다
- `GET /api/notifications`로 읽음/안읽음 포함 목록 조회가 된다
- `PATCH /api/notifications/{id}/read`가 동작한다
- FE 알림 페이지에서 빈 상태/읽음 상태/UI 이동이 확인된다
