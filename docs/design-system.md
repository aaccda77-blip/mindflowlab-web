# 마인드플로우 랩 명심 디자인 시스템 명세서 (Design System)
**문서 버전:** v1.0  
**작성 일자:** 2026-09-21  
**상태:** APPROVED & STABLE  
**핵심 파일:** `css/myungsim-design-tokens.css`, `js/myungsim-design-system.js`, `design-system.html`

---

## 1. 디자인 원칙 (Design Principles)

1. **비낙인(Non-judgmental) & 비단정(Non-conclusive):** 사용자를 평가하거나 특정 유형으로 규정하지 않고, 스스로 자신의 작동방식을 관찰하도록 지원합니다.
2. **현실 삶으로의 복귀(Life-oriented):** 앱 내 과도한 체류나 도파민 중독(카지노/타로식 이펙트)을 유도하지 않으며, 일상으로 가볍게 돌아갈 수 있도록 돕습니다.
3. **절제된 시각적 평온함(Calm Visuals):** 원색의 강한 자극 대신 따뜻한 아이보리, 깊은 에메랄드, 네이비, 소프트 골드 톤으로 정서적 안정감을 부여합니다.

---

## 2. 디자인 토큰 명세 (Design Tokens)

### 1) 컬러 토큰 (Color Tokens)
- `--warm-ivory: #F7F4EC`: 기본 배경 및 부드러운 카드 서피스.
- `--myungsim-emerald: #0F6B5B`: 핵심 브랜드 에메랄드 그린 (Primary CTA 및 링크).
- `--myungsim-emerald-dark: #0A493E`: 버튼 호버/액티브 상태.
- `--myungsim-emerald-light: #ECFDF5`: 선택된 항목 배경 및 상태 칩 배경.
- `--deep-navy: #14233B`: 타이틀, 주요 텍스트 및 다크 카드 배경.
- `--soft-gold: #C7A86B`: 정제된 테두리 및 카테고리 칩.
- `--soft-sage: #DDE8E0`: 중립적인 카드 보더 및 디바이더.
- `--charcoal: #252A2D`: 본문 가독성을 위한 메인 텍스트 차콜.
- `--slate-muted: #64748B`: 부가 설명 및 캡션 텍스트.

### 2) 타이포그래피 (Typography)
- 기본 폰트: `Pretendard`, sans-serif (본문 및 UI 전반)
- 포인트 폰트: `Noto Serif KR` / `MaruBuri` (카드 내 질문 키워드 1~2개 강조 시에만 제한적 사용, 본문 전체 세리프 금지)
- Type Scale:
  - Display: 28~36px (1.25 라인높이)
  - H1: 22~26px (1.35 라인높이)
  - H2: 18~22px (1.4 라인높이)
  - Body: 15px (1.6 라인높이)
  - Body-SM: 13px (1.5 라인높이)
  - Caption: 12px (1.4 라인높이)

### 3) 공간 및 간격 (Spacing Tokens - 4px Grid)
- `space-1 (4px)`, `space-2 (8px)`, `space-3 (12px)`, `space-4 (16px)`, `space-5 (20px)`, `space-6 (24px)`, `space-8 (32px)`, `space-10 (40px)`, `space-12 (48px)`

### 4) 라디우스 (Radius)
- Card: `24px` (`--radius-card`)
- Button: `14px` (`--radius-button`)
- Choice Card: `16px` (`--radius-choice`)
- Chip / Badge: `9999px` (`--radius-chip`)

### 5) 섀도우 (Shadow Tokens)
- 타로/카지노식 강한 플로팅 그림자 금지. 부드럽고 차분한 `subtle` 및 `card` 섀도우만 허용.
- `--shadow-subtle: 0 1px 3px rgba(15, 23, 42, 0.04)`
- `--shadow-card: 0 4px 14px rgba(15, 23, 42, 0.05)`

### 6) 모션 (Motion Tokens)
- Fast: 180ms cubic-bezier(0.16, 1, 0.3, 1) (버튼 호버, 칩 토글)
- Normal: 280ms (모달 열림, 카드 전환)
- Card Flip: 550ms (카드 공개)
- 접근성: `@media (prefers-reduced-motion: reduce)` 강제 준수.

---

## 3. 핵심 컴포넌트 가이드라인

### 1) 버튼 (Buttons)
- **Primary:** `.btn-primary` (에메랄드 배경, 흰색 텍스트). 한 화면당 최대 1개.
- **Secondary:** `.btn-secondary` (흰색 배경, 테두리, 네이비 텍스트).
- **Ghost:** `.btn-ghost` (배경 투명, 회색 텍스트).
- **Danger:** `.btn-danger` (연한 로즈 배경, 적색 텍스트, 비가역적 삭제 시).
- **Exit:** `.btn-exit` ("여기서 끝내기", "이걸로 충분해요").
- **터치 영역:** 모든 버튼은 최소 44px의 터치 타깃 높이를 보장.

### 2) 카드 (Cards)
- 모바일 기준 240~246px 폭, 360~390px 높이의 스탠다드 인사이트 카드 레이아웃.
- 앞면: 카테고리 칩 + 카드 타이틀 + 명심 질문 + 푸터 코드.
- 뒷면: 0 심볼 + SCAN · SYNC · SHIFT 브랜드 식별자 (오컬트 장식 금지).

### 3) 선택 컴포넌트 (Choice Cards)
- 감정, 신체 감각, 충동, 10% 행동 선택에 사용되는 컴포넌트.
- 기본 상태 / 선택 상태(`.is-selected`, 에메랄드 틴트 및 체크 아이콘) / 포커스 상태 지원.

---

## 4. 접근성 및 반응형 가이드

- **모바일 퍼스트:** 390px (iPhone 14/15)를 표준 기준으로 하여 375px, 393px, 430px 완벽 대응.
- **데스크톱:** 최대 컨텐츠 너비 600px(단일 컬럼 읽기 뷰) 또는 1120px(관리자 대시보드 뷰)로 제한하여 긴 텍스트가 좌우로 늘어지지 않도록 보호.
- **포커스 링:** 모든 상호작용 요소에 `focus-visible` 시 명확한 2px 에메랄드 아웃라인 제공.
