# Sidepick Design System Guide

## 목적

이 문서는 피그마 디자인 시스템 페이지를 개발 기준 문서로 번역한 운영 가이드다.  
앞으로 UI를 만들 때 아래 3가지를 한 번에 확인하는 것을 목표로 한다.

1. 어떤 토큰과 컴포넌트를 써야 하는지
2. 현재 코드에서 무엇이 이미 반영돼 있고 무엇이 아직 하드코딩인지
3. 새 화면/새 컴포넌트를 만들 때 어떤 순서와 체크리스트로 일관성을 지킬지

디자인 원본:
- Figma: [사이드픽 팀프로젝트 - `🔥Round2 디자인 시스템`](https://www.figma.com/design/9x8lEqyqnKFYQ9vrK9fasu/%EC%82%AC%EC%9D%B4%EB%93%9C%ED%94%BD_%ED%8C%80%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8?node-id=3002-22157&p=f&m=dev)

## 소스 오브 트루스

우선순위는 아래 순서를 따른다.

1. 피그마 디자인 시스템 페이지
2. 이 문서
3. 실제 구현 코드

코드와 피그마가 다르면 임의로 새 값을 만들지 말고, 먼저 피그마 기준으로 맞출지 코드 기준으로 역정렬할지 결정한다.

## 현재 피그마 구조

`🔥Round2 디자인 시스템` 페이지는 크게 3개 레이어로 구성돼 있다.

### 1. Foundations

- `Color`
- `Spacing`
- `Radius`
- `Typography`

이 영역은 토큰 정의용이다. 새 UI를 만들 때는 반드시 여기서 색상, 간격, 라운드, 타이포를 먼저 고른 뒤 컴포넌트를 조합한다.

### 2. Base Components

피그마 `디자인시스템-컴포넌트` 섹션에 아래 컴포넌트가 정의돼 있다.

- `CTA`
- `Tag`
- `Chip_Text`
- `Chip_Category`
- `Chip_Keyword`
- `TextField`
- `TextField/TextArea`
- `TextField/TextField`
- `Segmented Control`
- `Navigation Bar`
- `Select Box`
- `Radio Tab`
- `Search Bar`
- `Filter`
- `Tab`
- `Check Box`
- `Badge`
- `Header`
- `Text Button`
- `Image Upload`
- `FAB Button`
- `Progress bar`
- `Link`
- `Reaction Button`
- `Bookmark Button`
- `Message bubble`
- `Image Preview`
- `Chat Input`
- `Profile Image`
- `Dim`
- `HashTag`
- `Logo`

### 3. Compound Components

피그마 `디자인 시스템 - 컴파운드 컴포넌트` 섹션에 아래 묶음형 UI가 있다.

- `Accordion`
- `Accordion/Guide`
- `Accordion/Graph`
- `Accordion/Example`
- `Card`
- `BottomSheet`
- `Notification`

실제 화면을 만들 때는 가능한 한 Base Component를 먼저 조합하고, 반복적으로 같이 쓰이는 패턴만 Compound Component로 승격한다.

## 현재 코드에서 보이는 디자인 토큰 경향

프론트엔드에는 아직 중앙 토큰 파일이 없다. 대신 Tailwind 유틸리티와 hex 값이 직접 박혀 있는 형태가 많다.

### Typography

기본 폰트는 [globals.css](/abs/path/D:/Codex_Folder/Sidepick/fe/src/styles/globals.css:1) 기준 `Pretendard`다.  
보조 폰트로 `Times_New_Roman`, `Bruno Ace SC`, `SF_Pro`가 선언돼 있다.

자주 등장하는 텍스트 크기:

- `12px`
- `14px`
- `16px`
- `20px`

권장 규칙:

- 본문/메타/칩 같은 작은 UI 텍스트는 `12px`, `14px` 중심으로 통일
- 화면 제목과 섹션 제목은 `16px`, `20px` 계층으로 유지
- 새 화면에서 임의 크기 추가보다 기존 스케일 재사용 우선

### Color

현재 코드에서 가장 많이 반복되는 색상은 아래와 같다.

| 역할 추정 | 값 |
| --- | --- |
| 브랜드 메인 그린 | `#5A876E` |
| 기본 텍스트 | `#131416` |
| 보조 텍스트 | `#8A8A8A` |
| 서브 텍스트 | `#494949` |
| 배경 그레이 | `#F8F8F8` |
| 비활성/보더 | `#E6E6E6`, `#EEEEEE`, `#D8D8D8` |
| 연한 성공 배경 | `#CBE5D8` |
| 강조 브라운 | `#C06D43` |

예시:

- [Chip.tsx](/abs/path/D:/Codex_Folder/Sidepick/fe/src/components/common/Chip.tsx:1)
- [CaseUi.tsx](/abs/path/D:/Codex_Folder/Sidepick/fe/src/components/common/CaseUi.tsx:1)
- [BottomNav.tsx](/abs/path/D:/Codex_Folder/Sidepick/fe/src/components/layout/BottomNav.tsx:1)

권장 규칙:

- 새 UI는 위 반복 색상에서 먼저 선택한다.
- 같은 역할인데 hex가 조금씩 다른 경우 새 색을 추가하지 말고 기존 대표색으로 수렴시킨다.
- 색상 이름은 문서/코드에서 역할 기준으로 부른다.
  - 예: `color.brand.primary`, `color.text.default`, `color.text.muted`, `color.surface.subtle`

### Spacing

자주 반복되는 간격/패딩 패턴:

- `4px`
- `8px`
- `10px`
- `12px`
- `14px`
- `16px`
- `20px`
- `24px`

권장 규칙:

- 내부 요소 간격은 `4 / 8 / 12 / 16`을 기본 축으로 사용
- 카드/섹션 패딩은 `16 / 20 / 24`
- 새 컴포넌트에서 `11`, `13`, `15` 같은 예외값은 가능하면 만들지 않음

### Radius

자주 반복되는 라운드 패턴:

- `4px`
- `8px`
- `10px`
- `12px`
- `16px`
- `20px`
- `999px` 또는 `full`

권장 규칙:

- 작은 칩/태그: `4px` 또는 `full`
- 입력, 카드, 패널: `8px`, `10px`, `12px`
- 바텀시트/네비게이션 상단: `16px`, `20px`

## 현재 구조의 문제점

### 1. 코드에 토큰 레이어가 없다

`tailwind.config.js`는 아직 확장 토큰이 비어 있고, 대부분의 화면이 hex/px 직접 입력 방식이다.

영향:

- 같은 역할의 색과 간격이 컴포넌트마다 조금씩 달라지기 쉽다.
- 피그마 업데이트가 생겨도 일괄 치환이 어렵다.
- 신규 화면에서 “비슷해 보이는 값”을 계속 복제하게 된다.

### 2. 컴포넌트는 있는데 스타일 계약이 약하다

예를 들어 `Chip`, `HeaderNav`, `BottomNav`, `CaseUi`는 이미 재사용 컴포넌트지만 공통 토큰이 아니라 내부 하드코딩으로 연결되어 있다.

영향:

- 같은 `Chip` 계열이라도 톤 확장 시 중복 코드가 늘어난다.
- 헤더/바텀네비/카드가 화면마다 미세하게 달라질 가능성이 높다.

### 3. 피그마와 코드의 연결 고리가 문서화되어 있지 않았다

지금까지는 “피그마에서 보고 비슷하게 구현”하는 방식에 가까웠다.  
앞으로는 “피그마 컴포넌트 이름 -> 코드 컴포넌트 이름 -> 허용 토큰”으로 매핑돼야 한다.

## 화면 제작 규칙

새 UI를 만들 때는 아래 순서를 기본 플로우로 사용한다.

1. 피그마에서 Base Component 또는 Compound Component가 이미 있는지 찾는다.
2. 있으면 새로 그리지 말고 해당 이름 기준으로 코드 컴포넌트를 재사용하거나 확장한다.
3. 없으면 Foundation에서 색상/간격/타이포를 먼저 고른 뒤 구현한다.
4. 구현 중 새 hex/새 px를 넣기 전에 기존 반복값으로 해결 가능한지 먼저 확인한다.
5. 반복 사용 가능성이 생기면 페이지 코드에 두지 말고 `components/common` 또는 `components/layout`으로 승격한다.

## 컴포넌트 매핑 규칙

현재 기준 권장 매핑은 아래와 같다.

| 피그마 | 코드 후보 |
| --- | --- |
| `Tag`, `Chip_*`, `HashTag` | `fe/src/components/common/Chip.tsx` |
| `Header` | `fe/src/components/layout/HeaderNav.tsx` |
| `Navigation Bar`, `FAB Button` | `fe/src/components/layout/BottomNav.tsx` |
| `Card`, `Badge`, `Reaction Button`, `Bookmark Button`, `Link` | `fe/src/components/common/CaseUi.tsx` 및 관련 카드 컴포넌트 |
| `Message bubble`, `Chat Input` | `fe/src/components/chatbot/*`, `fe/src/pages/ChatbotPage.tsx` |

새 컴포넌트를 만들 때는 피그마 이름과 코드 이름을 가능한 한 맞춘다.  
예를 들어 피그마가 `Text Button`이면 코드도 `TextButton`처럼 예측 가능한 이름을 사용한다.

## 구현 체크리스트

새 화면이나 새 컴포넌트를 만들기 전에 아래를 확인한다.

- 피그마 디자인 시스템에 같은 컴포넌트가 있는가
- 이미 존재하는 코드 컴포넌트로 조합 가능한가
- 색상은 기존 대표색을 재사용했는가
- 간격은 `4 / 8 / 12 / 16 / 20 / 24` 축 안에서 해결했는가
- 라운드는 `4 / 8 / 10 / 12 / 16 / 20 / full` 안에서 해결했는가
- 텍스트 크기는 기존 스케일을 재사용했는가
- hover/active/disabled 등 상태가 피그마와 맞는가
- 같은 스타일 로직이 두 화면 이상에 중복되지 않는가

## 바로 해야 할 정리 작업

문서만으로 끝내지 말고 아래 순서로 시스템을 코드에 고정하는 것을 권장한다.

1. `fe/src/styles/tokens.css` 또는 `fe/src/design/tokens.ts`를 만든다.
2. 최소한 아래 토큰부터 중앙화한다.
   - 색상
   - spacing
   - radius
   - font size / line height
3. `Chip`, `HeaderNav`, `BottomNav`, `CaseUi`부터 토큰 기반으로 리팩터링한다.
4. 이후 새 화면은 토큰 없는 직접 hex 입력을 금지한다.

## v1 토큰 초안

아래 정도를 첫 버전 공용 토큰 집합으로 잡는 것이 현실적이다.

### Color

- `color-brand-primary: #5A876E`
- `color-brand-primary-soft: #CBE5D8`
- `color-text-default: #131416`
- `color-text-secondary: #494949`
- `color-text-muted: #8A8A8A`
- `color-surface-default: #FFFFFF`
- `color-surface-subtle: #F8F8F8`
- `color-border-default: #E6E6E6`
- `color-border-soft: #EEEEEE`
- `color-accent-warning: #C06D43`

### Spacing

- `space-1: 4px`
- `space-2: 8px`
- `space-3: 12px`
- `space-4: 16px`
- `space-5: 20px`
- `space-6: 24px`

### Radius

- `radius-xs: 4px`
- `radius-sm: 8px`
- `radius-md: 10px`
- `radius-lg: 12px`
- `radius-xl: 16px`
- `radius-2xl: 20px`
- `radius-full: 999px`

## 문서 사용법

- 피그마 업데이트가 생기면 먼저 이 문서의 컴포넌트 목록과 토큰 표를 갱신한다.
- 새로운 공용 컴포넌트를 추가하면 `현재 피그마 구조`와 `컴포넌트 매핑 규칙`을 함께 수정한다.
- 화면 단위 PR에서 디자인 관련 판단이 들어갔다면 이 문서를 기준으로 근거를 남긴다.
