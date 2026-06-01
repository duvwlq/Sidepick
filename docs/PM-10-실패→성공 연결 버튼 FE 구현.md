# PM-10 — 실패→성공 연결 버튼 FE 구현

**작성일**: 2026-05-29
**작성자**: 오혜림 (팀장)
**티켓**: PM-10
**상태**: 🟡 부분 완료 (PD 디자인 검수만 대기)
**마감**: 5/30(금) 밤
**산출물**:
- [fe/src/components/ai-analysis/FailureToSuccessButton.tsx](../fe/src/components/ai-analysis/FailureToSuccessButton.tsx) (신규)
- [fe/src/pages/SuccessComparisonPage.tsx](../fe/src/pages/SuccessComparisonPage.tsx) (라우팅 타겟 placeholder)
- [fe/src/App.tsx](../fe/src/App.tsx) (라우트 등록)
- [fe/src/components/ai-analysis/AiAnalysisResult.tsx](../fe/src/components/ai-analysis/AiAnalysisResult.tsx) (통합)

---

## 1. 구현 내용

### 1.1 `FailureToSuccessButton` 컴포넌트

```tsx
type FailureToSuccessButtonProps = {
  caseId: string;
  relatedSuccessCount: number;
  onClick?: () => void;  // 커스텀 핸들러 (옵션)
};
```

**동작**:
- `relatedSuccessCount > 0` → **활성** (검은 배경, 클릭 가능)
  - 클릭 시 `/experiences/:id/success-comparison` 라우팅
  - 버튼 텍스트: "비슷한 성공 사례 보기 [N건] >"
- `relatedSuccessCount === 0` → **비활성** (회색, 클릭 불가)
  - 버튼 텍스트: "관련 성공 사례가 아직 없어요"
  - `disabled` 속성 + `aria-disabled` 적용

### 1.2 `SuccessComparisonPage` placeholder

- Route: `/experiences/:id/success-comparison`
- 내용: "W3 구현 예정" 안내 + case_id 확인용 영역 + 이전 페이지 버튼
- W3에 PD 디자인 받아 상하 분할 UI로 교체

### 1.3 `AiAnalysisResult` 통합

- 유사 사례 섹션 하단에 자연스럽게 배치
- mockAnalysisData에 `caseId: 'case_123'`, `relatedSuccessCount: 3` 추가

---

## 2. DoD 체크

- [x] 버튼 컴포넌트 React 구현 (Tailwind) — `FailureToSuccessButton.tsx`
- [x] 클릭 시 라우팅 (`/experiences/:id/success-comparison`) — `useNavigate` + 라우트 등록
- [x] 활성/비활성 상태 처리 (관련 성공 사례 0건일 때 비활성) — `relatedSuccessCount` 조건 분기
- [x] 모바일/웹 반응형 확인 — `w-full` + `h-12` + `text-xs` 모바일 우선, 데스크탑에서도 동작
- [ ] **PD 디자인 검수 OK** — PD 시안 받은 후 색상·아이콘·간격 조정 필요

→ **DoD 5개 중 4개 완료**. PD 디자인 검수만 남음.

---

## 3. PD 디자인 받은 후 조정 항목 (TODO)

- [ ] 색상 (현재 black/white → PD 브랜드 컬러)
- [ ] 아이콘 (현재 `>` 텍스트 → PD가 정한 화살표 아이콘 또는 SVG)
- [ ] 카운트 뱃지 디자인 (현재 흰 원 + 검은 숫자 → PD 시안 적용)
- [ ] 호버/탭 인터랙션 (현재 단순 색상 변화 → PD 모션 적용)
- [ ] 비활성 상태 문구 (현재 "관련 성공 사례가 아직 없어요" → PD UX 라이팅)

---

## 4. 검증 방법

### 로컬 테스트

```bash
cd ~/Sidepick/fe
npm install     # node_modules 없는 환경에서
npm run dev
# 브라우저에서:
# http://localhost:5173/analysis-result
# → 페이지 하단 "비슷한 성공 사례 보기 [3] >" 버튼 확인
# → 클릭 시 /experiences/case_123/success-comparison 으로 라우팅
```

### 비활성 상태 검증

mockAnalysisData의 `relatedSuccessCount: 3` → `0`으로 변경 후 새로고침 → "관련 성공 사례가 아직 없어요" 회색 버튼 표시.

---

## 5. 후속 작업 (W3 인계)

- W3 시작 (6/1): PD 디자인 시안 수령 → 색상·아이콘·인터랙션 조정
- W3 진행: `SuccessComparisonPage` 상하 분할 UI 본격 구현 (placeholder 교체)
- W4: BE API 연동 (실제 `relatedSuccessCount` 동적 계산)

---

## 6. 관련 commit

- 본 PR: PM-10 컴포넌트 + 라우트 + placeholder + 통합
