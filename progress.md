# Progress

## 완료
- 크레인 게임 UI 프로토타입 (HTML/CSS/JS)
- GitHub Pages 배포 파이프라인
- CEO 리뷰 → 8개 기능 스코프 확정
- Eng 리뷰 → Supabase RPC, 모듈 분리, SQL 테스트 결정
- 디자인 컨설팅 → DESIGN.md 생성 (Playful Premium, Outfit+Pretendard, Gold 팔레트)
- 디자인 리뷰 → 플랜 디자인 완성도 4→9/10
- Step 1: DB 마이그레이션 SQL (테이블 + RPC + RLS + 인덱스)
- Step 2: game.js → ES Modules 6개 파일 분리
- Step 3: 이벤트 진입 분기 + 서버 당첨 판정 연동
- Step 4: 쿠폰 페이지 (coupon.html + coupon.js)
- Step 5: 관리자 페이지 (admin.html + admin.css + admin.js)
- Step 6: 딜라이트 (햅틱, 긴장감, SNS 공유, 꽝 오버레이)
- Step 7: DESIGN.md 색상/폰트 적용 (CSS 변수, Outfit+Pretendard)
- SQL 테스트 스크립트 (T1~T6, T9)
- Supabase 프로젝트 생성 + config.js 연동
- 마이그레이션 실행 완료
- 관리자 계정 생성 완료
- GitHub Pages 배포 + 라이브 테스트 완료

- 크레인 공 잡기 버그 수정 (z-index, 좌표, BALL_SIZE, shaking 충돌)
- E2E 테스트 통과 (관리자 로그인 → 이벤트 생성 → 게임 플레이 → 서버 당첨 → 쿠폰 페이지)

- SQL 테스트 T1~T6, T9 전부 통과 (T6 assertion 버그 수정 포함)
- Supabase CLI 영구 로그인 + 프로젝트 링크 완료

## 다음
- P2: 사운드 이펙트
- P3: prefers-reduced-motion
