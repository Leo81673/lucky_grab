# Progress

## 완료
- 크레인 게임 UI 프로토타입 (HTML/CSS/JS)
- GitHub Pages 배포 파이프라인
- CEO 리뷰 — 8개 기능 스코프 확정
- Eng 리뷰 — Supabase RPC, 모듈 분리, SQL 테스트 결정
- 디자인 컨설팅 — DESIGN.md 생성 (Playful Premium, Outfit+Pretendard, Gold 팔레트)
- 디자인 리뷰 — 플랜 디자인 완성도 4→9/10
- plan.md 업데이트

## 완료 (이번 세션)
- Step 1: DB 마이그레이션 SQL (테이블 + RPC + RLS + 인덱스)
- Step 2: game.js → ES Modules 6개 파일 분리
- Step 3: 이벤트 진입 분기 + 서버 당첨 판정 연동
- Step 4: 쿠폰 페이지 (coupon.html + coupon.js)
- Step 6: 딜라이트 (햅틱, 긴장감 "과연...?", SNS 공유, 꽝 오버레이)
- Step 7: DESIGN.md 색상/폰트 적용 (CSS 변수, Outfit+Pretendard)
- SQL 테스트 스크립트 (T1~T6, T9)

## 완료 (추가)
- Step 5: 관리자 페이지 (admin.html + admin.css + admin.js)
  - 로그인/로그아웃
  - 이벤트 CRUD + 보상 설정
  - 통계 카드 (참여자/당첨률/남은 보상)
  - 이벤트 상세 (QR 코드 표시+다운로드, 보상 현황, 당첨 내역)

## 진행 중
- (없음)

## 다음
- Supabase 프로젝트 생성 + config.js에 URL/key 입력
- 마이그레이션 실행 (001_initial.sql)
- SQL 테스트 실행
- 실제 연동 테스트
- deploy.yml에서 preview-design-system.html 제외 검토
