# LangSmith 셋업 가이드 (PM-07)

> 📌 **Status**: v1 (셋업 진행 중)
> 📌 **Last updated**: 2026-05-19
> 📌 **담당**: 팀장 (오혜림)
> 📌 **전달 대상**: AI, BE
> 📌 **목적**: 에이전트 C ReAct 추론 과정 디버깅 + 비용/응답 트레이싱

---

## 1. LangSmith란?

LangChain 공식 디버깅/모니터링 플랫폼.
ReAct 루프의 각 스텝(Tool 선택 → Tool 호출 → 응답 생성)을 시각화하여 환각/실패 원인 분석에 사용.

- **무료 티어**: 월 5,000 trace
- **유료 전환 불필요**: 학생 프로젝트 규모에서 충분

---

## 2. 셋업 절차 (팀장 직접 진행)

### 2.1 계정 생성

1. https://smith.langchain.com 접속
2. 우상단 **Sign up** → GitHub 또는 Google 로그인
3. Personal workspace 자동 생성 확인

### 2.2 API 키 발급

1. 좌측 하단 **Settings** (톱니바퀴 아이콘) 클릭
2. **API Keys** 탭 선택
3. **+ Create API Key** 클릭
4. 이름: `sidepick-dev` (또는 원하는 이름)
5. **Create** → 생성된 키 복사 (한 번만 표시되니 즉시 저장!)

### 2.3 프로젝트 생성

1. 좌측 **Projects** 메뉴
2. **+ New Project** 클릭
3. 이름: `sidepick-agent-c`
4. **Create** 클릭

### 2.4 환경 변수 설정

`ai/.env` 파일에 아래 4개 변수 추가:

```bash
LANGCHAIN_TRACING_V2=true
LANGCHAIN_ENDPOINT=https://api.smith.langchain.com
LANGCHAIN_API_KEY=<2.2에서 발급받은 키>
LANGCHAIN_PROJECT=sidepick-agent-c
```

> ⚠️ `.env`는 `.gitignore`에 등록되어 있어 push되지 않음. **절대 코드에 하드코딩 금지**.

### 2.5 동작 확인

LangChain Agent 코드가 있다면 한 번 실행 후:

1. LangSmith 웹사이트 → `sidepick-agent-c` 프로젝트 열기
2. 우측에 trace가 들어왔는지 확인
3. trace 클릭 → ReAct 스텝 시각화 확인

---

## 3. AI / BE 공유 사항

| 변수명 | 값 (공유) | 용도 |
|---|---|---|
| `LANGCHAIN_TRACING_V2` | `true` | 트레이싱 ON/OFF 스위치 |
| `LANGCHAIN_ENDPOINT` | `https://api.smith.langchain.com` | LangSmith API 엔드포인트 |
| `LANGCHAIN_API_KEY` | _(팀장이 디스코드 DM으로 개별 전달)_ | 인증 키 |
| `LANGCHAIN_PROJECT` | `sidepick-agent-c` | 프로젝트 이름 |

- **AI**: 위 4개 변수 본인 로컬 `.env`에 추가
- **BE**: 동일하게 본인 로컬 `.env`에 추가 (4주차 에이전트 C 연동 시 사용)
- **운영 배포 시**: 별도 프로덕션 API 키 발급 권장 (개발용 키와 분리)

---

## 4. 활용 예시

### 4.1 trace 검증 항목

- ReAct 각 스텝의 입력/출력
- Tool 호출 횟수 (max_iterations 모니터링)
- 토큰 사용량 (입력/출력 분리)
- 응답 시간 분포
- Plan B 발동 비율 (`fallback_reason` 태그)

### 4.2 환각 검증

응답에 `case_id` 인용이 누락된 trace를 필터링하여 환각 발생률 측정 (4주차 50개 시나리오 테스트 시 활용).

---

## 5. 다음 단계

- [x] 팀장: 계정 생성 + API 키 발급
- [x] 팀장: 프로젝트 생성 (`sidepick-agent-c`)
- [ ] 팀장: AI/BE에 API 키 디스코드 DM 공유
- [ ] AI: 로컬 `.env`에 4개 변수 추가
- [ ] BE: 로컬 `.env`에 4개 변수 추가 (4주차)
- [ ] AI: 4주차 ReAct 구현 시 LangSmith trace 정상 기록 확인
