# Design System — Lucky Grab

## Product Context
- **What this is:** TAPE 매장 이벤트용 모바일 크레인 게임. QR 스캔 → 뽑기 → 쿠폰 획득.
- **Who it's for:** TAPE 매장 방문 손님 (모바일, 30초 경험)
- **Space/industry:** 오프라인 리테일 이벤트, 매장 마케팅
- **Project type:** 모바일 웹앱 (게임 + 쿠폰 + 관리자 대시보드)

## Aesthetic Direction
- **Direction:** Playful Premium — 프리미엄 아케이드 느낌
- **Decoration level:** Intentional — 별 배경, 유리 반사 등 깊이감 있지만 절제됨
- **Mood:** "와, 이 가게 재밌다." 고급스럽지만 친근하고 활기찬 느낌. 다크 배경이 아케이드 몰입감을, 골드 액센트가 TAPE 브랜드를, 둥글둥글한 UI가 게임의 재미를 전달한다.

## Typography
- **Display/Hero:** Outfit (900) — 기하학적이고 대담한 산세리프. TAPE 영문 브랜딩에 강한 개성.
- **Body:** Pretendard Variable — 한국 웹 최강 폰트. 깨끗하고 현대적, 한국어 가독성 우수.
- **UI/Labels:** Pretendard Variable (600)
- **Data/Tables:** Pretendard Variable (700, tabular-nums) — 카운트다운, 통계 숫자에 정렬된 숫자.
- **Code:** 해당 없음
- **Loading:**
  - Outfit: `https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap`
  - Pretendard: `https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css`
- **Scale:**
  - 48px — Display (TAPE 로고)
  - 28px — Heading (당첨 결과 제목, 섹션 제목)
  - 20px — Subheading (관리자 페이지 제목)
  - 15px — Body (설명 텍스트, 안내 문구)
  - 13px — Small (힌트, 레이블, 보조 텍스트)
  - 11px — Caption (카테고리 레이블, 메타 정보)

## Color
- **Approach:** Expressive — 색상이 브랜드와 분위기를 적극적으로 전달
- **Primary (Gold):** #F5A623 — TAPE 브랜드, 따뜻하고 초대하는 느낌. 로고, 강조, 골드 버튼.
  - Light: #FFD07A
  - Dark: #D48A0C
- **Action (Coral Red):** #FF5566 — "잡기!" CTA, 긴급/행동 유도 요소.
  - Hover: #FF3347
- **Neutrals (cool grays):**
  - Background: #0B0B1A (깊은 네이비 블랙)
  - Elevated BG: #12122A
  - Surface: #1A1A2E (카드, 머신 영역)
  - Surface Hover: #22223A
  - Border: #2A2A44
  - Text: #F0F0F5
  - Text Secondary: #B0B0CC
  - Text Muted: #8888AA
  - Text Dim: #555577
- **Semantic:**
  - Success: #4ADE80
  - Warning: #FBBF24
  - Error: #F87171
  - Info: #60A5FA
- **Dark mode:** 기본이 다크 모드. 라이트 모드는 관리자 대시보드 옵션으로 제공.
  - 라이트 모드: BG → #F5F5F8, Surface → #FFFFFF, Text → #1A1A2E, Gold → #D48A0C

## Spacing
- **Base unit:** 4px
- **Density:** Comfortable — 모바일에서 터치 대상이 넉넉하되 허전하지 않음
- **Scale:**
  - 2xs: 2px
  - xs: 4px
  - sm: 8px
  - md: 16px
  - lg: 24px
  - xl: 32px
  - 2xl: 48px
  - 3xl: 64px

## Layout
- **Approach:** Single Column, Mobile-First
- **Grid:** 게임/쿠폰 — 단일 컬럼 420px 최대 폭. 관리자 — 반응형, 960px 최대 폭.
- **Max content width:** 420px (게임/쿠폰), 960px (관리자)
- **Border radius:**
  - sm: 4px (태그, 작은 요소)
  - md: 8px (입력 필드, 알림)
  - lg: 12px (카드, 테이블 래퍼)
  - xl: 20px (머신 영역, 결과 카드, 쿠폰 카드)
  - full: 9999px (버튼, 배지, 토글)

## Motion
- **Approach:** Expressive (게임) / Intentional (쿠폰, 관리자)
- **Easing:**
  - Enter: cubic-bezier(0.16, 1, 0.3, 1) — 부드러운 감속
  - Exit: cubic-bezier(0.7, 0, 0.84, 0) — 빠른 이탈
  - Move: ease-in-out
  - Bounce: cubic-bezier(0.34, 1.56, 0.64, 1) — 결과 카드 등장
- **Duration:**
  - Micro: 50-100ms (버튼 press, 토글)
  - Short: 150-250ms (hover, 포커스, 토스트)
  - Medium: 250-400ms (카드 전환, 오버레이)
  - Long: 400-700ms (크레인 이동, 로프 내림/올림)
- **Game-specific:**
  - 물리 시뮬레이션: requestAnimationFrame (60fps)
  - 공 흔들림: 150ms ease infinite
  - 컨페티: 1.5s ease forwards
  - "과연...?" 긴장감: 1-2s 느린 상승 + 배경 조명

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-19 | 디자인 시스템 생성 | /design-consultation 기반, Playful Premium 방향 |
| 2026-03-19 | Outfit + Pretendard 조합 | 영문 브랜딩 강화 + 한국어 최적 가독성 |
| 2026-03-19 | 골드/앱버 기반 색상 체계 | TAPE 브랜드 차별화 (네온 대신 프리미엄) |
| 2026-03-19 | 다크 기본 + 라이트 관리자 옵션 | 게임 몰입감(다크) + 관리자 편의성(라이트 옵션) |
