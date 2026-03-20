# Plan — Lucky Grab Event Platform

## 기술 스택
- **Frontend**: 순수 HTML/CSS/JS (ES Modules, 프레임워크 없음)
- **Backend**: Supabase (PostgreSQL + RPC + RLS + Auth)
- **Deploy**: GitHub Pages (프론트엔드) + Supabase (백엔드)
- **핑거프린트**: FingerprintJS 오픈소스 (CDN) + localStorage fallback

## 아키텍처

```
  브라우저 ──── Supabase JS SDK ────▶ PostgreSQL
                                       ├── RPC: play_grab()  (당첨 판정)
                                       ├── RLS: coupons      (쿠폰 조회/사용)
                                       ├── RLS: events       (관리자 CRUD)
                                       └── Auth              (관리자 로그인)
```

## DB 스키마

```sql
events (id uuid PK, name text, slug text UNIQUE, starts_at timestamptz,
        ends_at timestamptz, max_plays_per_device int, is_active bool, created_at timestamptz)

prizes (id uuid PK, event_id uuid FK, title text, description text, weight int,
        total_quantity int, remaining_quantity int, coupon_validity_minutes int)

participants (id uuid PK, event_id uuid FK, fingerprint text, ip_address inet,
              played_at timestamptz, prize_id uuid FK nullable)

coupons (id uuid PK, participant_id uuid FK, prize_id uuid FK, code text UNIQUE,
         expires_at timestamptz, is_used bool DEFAULT false, used_at timestamptz, created_at timestamptz)
```

인덱스: `participants(event_id, fingerprint)`, `participants(event_id, ip_address)`, `prizes(event_id)`

## RPC 함수: play_grab()

```
  play_grab(event_slug, fingerprint, client_ip)
  1. SELECT event → 없으면 EVENT_NOT_FOUND
  2. 시간 체크 → EVENT_NOT_STARTED / EVENT_EXPIRED
  3. 횟수 체크 → LIMIT_EXCEEDED
  4. 가용 상품 조회 → 없으면 꽝 (prize=null)
  5. 가중치 랜덤 선택
  6. atomic 재고 차감 (remaining_quantity - 1 WHERE > 0)
  7. 쿠폰 INSERT + 참여 INSERT
  8. RETURN {prize, coupon}
```

## 파일 구조

```
  수정:     index.html, style.css
  새 파일:  js/config.js, js/supabase-api.js, js/physics.js, js/crane.js, js/ui.js, js/game.js
            js/sound.js, js/fingerprint.js, js/coupon.js, js/admin.js
            coupon.html, admin.html, 404.html, CNAME
            supabase/migrations/001_initial.sql
            supabase/tests/test_play_grab.sql
```

## 기능 목록

### 핵심 기능
1. **서버 당첨 판정** — Supabase RPC, atomic 재고 차감
2. **어뷰징 방지** — FingerprintJS + IP + 이벤트별 횟수 제한
3. **관리자 대시보드** — 이벤트 CRUD, 보상 설정, 당첨 내역, 통계, QR 표시+다운로드
4. **QR 이벤트** — 이벤트별 slug, 유효기간, 만료 처리
5. **쿠폰 표시** — 스탑워치 카운트다운 (Gold→Warning→Error 색전환) + 사용완료 처리

### 딜라이트
6. **햅틱 피드백** — navigator.vibrate
7. **긴장감 연출** — "과연...?" 텍스트 + 슬로모션 + 배경 어두워짐
8. **SNS 공유 카드** — Canvas→blob 이미지 + Web Share API (fallback: 클립보드)
9. **꽝 오버레이** — 당첨과 동등한 결과 화면 + 따뜻한 안내 + 남은 횟수

### 이벤트 진입 분기 화면
- 이벤트 없음 → "이벤트를 찾을 수 없어요" + QR 재스캔 안내
- 이벤트 만료 → "이벤트가 끝났어요 🎪" + TAPE 안내
- 이벤트 미시작 → "곧 시작!" + 카운트다운
- 횟수 초과 → "이미 참여하셨어요!" + 이전 결과 안내

## 인터랙션 상태

| Feature | Loading | Empty | Error | Success | Partial |
|---------|---------|-------|-------|---------|---------|
| 게임 로드 | 머신 실루엣+골드펄스 | N/A | 이벤트 분기 화면 | 게임 준비 | SDK 로딩(잡기 비활성) |
| 잡기 API | 크레인 애니메이션 | N/A | "네트워크 확인" 토스트 | 결과 오버레이 | N/A |
| 쿠폰 | 카드 스켈레톤 | N/A | "쿠폰 없음" | 쿠폰 카드 | 만료/사용됨 |
| 사용완료 | 버튼 스피너 | N/A | "다시 시도" | 사용완료 디자인 | N/A |
| 관리자 로그인 | 버튼 스피너 | N/A | 인라인 에러 | 대시보드 이동 | N/A |
| 이벤트 목록 | 스켈레톤 | "첫 이벤트를 만들어보세요!" | 재시도 버튼 | 테이블 | N/A |
| 당첨 내역 | 스켈레톤 | "QR을 공유해보세요!" | 재시도 버튼 | 테이블 | N/A |

## 반응형 & 접근성
- 가로 모드: "세로로 돌려주세요" 안내 오버레이 (게임/쿠폰)
- 관리자 모바일: 통계 카드 1열, 테이블 가로 스크롤
- 터치 대상: 최소 44×44px
- ARIA: role="dialog" (오버레이), aria-live="polite" (카운트다운)
- SDK 지연 로딩: HTML 먼저 렌더 → SDK async/defer

## 보안
- anon key만 클라이언트 노출 (RLS 보호)
- service_role key 없음 (RPC가 대체)
- 관리자 RLS: auth.uid() 기반
- 쿠폰 UUID 비추측성으로 보호

## 구현 순서
1. Supabase 프로젝트 셋업 + DB 마이그레이션 (테이블 + RPC + RLS)
2. game.js 모듈 분리 + Supabase 연동
3. 이벤트 진입 분기 + 서버 당첨 판정 연동
4. 쿠폰 페이지 (coupon.html)
5. 관리자 페이지 (admin.html)
6. 딜라이트 (햅틱, 긴장감, SNS 공유, 꽝 오버레이)
7. DESIGN.md 색상/폰트 적용
