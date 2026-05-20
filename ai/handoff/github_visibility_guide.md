# 사이드픽 (Sidepick) — GitHub 비공개 ↔ 공개 전환 가이드

> 발표 / 심사위원 접근 / 포트폴리오 공유 등 외부 노출 필요 시 활용

---

## ⚠️ 잘못된 개념 정리

**SSH 키는 외부인 접근 권한과 무관합니다.**
- SSH 키 = 본인이 push/pull할 때 인증용
- 외부인 레포 접근 권한과는 다른 개념

---

## 외부 노출 방법 3가지

### 🟢 옵션 A: 임시 Public 전환 (가장 빠르고 추천)

**경로**: Settings → General → Danger Zone → Change visibility → Make public

- 가장 빠르고 확실 (URL만 주면 끝)
- 심사·평가 종료 후 다시 Private로 전환 가능
- **단, 보안 사전 체크 필수** (아래 참조)

### 🟡 옵션 B: Collaborator 추가

**경로**: Settings → Collaborators → Add people

- 심사위원의 **GitHub 계정 ID를 알아야 함**
- 학원 측에 "심사위원 GitHub 계정 알려주세요" 문의 필요
- 시간 압박 상 어려울 수 있음

### 🟡 옵션 C: Public Mirror 레포 별도 생성

- 새 Public 레포 만들고 `git push --mirror`
- 본 레포는 Private 유지
- 시간 좀 걸림, 추천 안 함

---

## ⚠️ Public 전환 전 보안 체크리스트 (필수!)

학원 제출 전에 반드시 확인:

```
□ .env 파일이 commit된 적 없는지
  → git log --all --full-history -- .env

□ API 키 / Claude API Key 하드코딩 안 됐는지
  → grep -i "sk-\|api_key\|secret" 검색

□ DB 비밀번호 / 카카오 OAuth Secret 노출 없는지
  → grep으로 password, secret 검색

□ .env.example만 있고 실제 .env는 .gitignore 처리 됐는지
  → cat .gitignore | grep ".env"

□ ai/handoff/ 폴더 비공개 처리 확인 (이미 force push 완료)
  → cat .gitignore | grep "handoff"
```

---

## 사이드픽 보안 5종 100% 이행 상태

메모리 기준 (BE-014 보안 체크리스트):

1. **HTTPS / SSL** — api.side-pick.app Let's Encrypt 인증서 ✅
2. **Secret 관리** — GitHub Actions Secrets + .env 미커밋 ✅
3. **DB 외부 차단** — MySQL 3306 포트 차단 ✅
4. **SSH 포트 제한** — 22 포트 특정 IP만 허용 ✅
5. **환경파일 미커밋** — .env git tracked X ✅

→ 대체로 안전한 상태지만 **Public 전환 전 한 번 더 확인 권장**

---

## 추천 진행 순서 (사이드픽 5/12 발표 기준)

```
1. 빠르게 보안 체크 (5분)
2. Public 전환 (학원 제출 직전)
3. 학원 제출 URL: https://github.com/duvwlq/Sidepick
4. 심사 끝나면 다시 Private 전환
```

---

## 자주 묻는 질문

### Q1. 발표 끝나고 다시 Private로 돌리려는데 안전한가요?
A. 네. 한 번 Public이었다고 해서 영원히 노출되는 건 아닙니다.
다만 누군가 **fork 또는 clone**했을 수 있으니, 민감 정보가 commit되어 있었다면 git history rewrite로 제거 필요.

### Q2. Collaborator 추가하면 자동으로 권한이 갑니까?
A. 추가 후 초대 메일을 받은 사용자가 **수락**해야 권한이 활성화됩니다.

### Q3. Public Mirror 레포에서 실수로 commit하면 어떻게 되나요?
A. Public Mirror는 단방향(원본 → mirror) 동기화이므로 mirror에 직접 commit해도 원본에 반영되지 않습니다.

### Q4. 학원 제출용 GitHub URL 만들 때 README는?
A. README.md에 다음 정보 포함 권장:
- 프로젝트 개요 (1~2줄)
- 기술 스택
- 배포 URL
- 팀 소개
- 라이선스

---

## 포트폴리오 공유 시 추가 권장사항

- README에 **스크린샷 또는 시연 영상 GIF** 첨부
- **CONTRIBUTING.md** 또는 개발 환경 설정 가이드
- **CHANGELOG.md** 또는 v1 → v2 로드맵
- 주요 기술 결정 사항 (자체 IP 어필 포인트 등) 별도 문서

---

**참고**: 사이드픽은 5/12 발표 시 임시 Public 전환 후 학원 제출했습니다.
포트폴리오/면접 시 GitHub 링크 공유 필요할 때 다시 Public 전환하시면 됩니다.
