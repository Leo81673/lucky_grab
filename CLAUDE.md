# Lucky Grab — 모바일 인형뽑기

TAPE 매장 이벤트용 모바일 크레인 게임. 손님이 QR로 접속 → 뽑기 게임 → 보상 획득.

## 세션 워크플로우

### 시작 시
1. `git fetch origin` 후 로컬과 리모트 차이 확인
2. pull할 내용이 있으면 `git pull` 실행
3. `plan.md`와 `progress.md`를 읽고 현재 상태 파악
4. 사용자에게 현재 상태와 다음 할 일을 간결하게 안내

### 종료 시 (`/bye`)
1. progress.md 업데이트 (완료 항목 반영)
2. 모든 변경사항 commit + push
3. GitHub Pages 배포 트리거 확인
4. 세션 요약 출력

## 작업 관리

- **plan.md**: 전체 구현 계획과 아키텍처 결정사항. 새 작업 시작 전 반드시 읽을 것.
- **progress.md**: 현재 진행 상태, 완료된 항목, 다음 할 일. 작업 시작/완료 시 업데이트할 것.
- 에이전트는 작업 시작 시 두 파일을 먼저 읽고, 자기 작업 범위를 파악한 후 진행한다.
- 작업 완료 후 progress.md에 결과를 기록한다.

## 커맨드

| 커맨드 | 용도 |
|--------|------|
| `/bye` | 세션 종료 — commit, push, deploy |
| `/update` | plan.md, progress.md, CLAUDE.md 정합성 검사 및 업데이트 |
| `/deploy-preview` | 프리뷰 배포 + QR URL 안내 |
| `/mobile-test` | 모바일 뷰포트 QA 테스트 |

## 현재 상태

- 순수 HTML/CSS/JS (ES Modules, 프레임워크 없음)
- 백엔드: Supabase (PostgreSQL + RPC + RLS + Auth)
- 배포: GitHub Pages (프론트엔드) + Supabase (백엔드)
- 핑거프린트: FingerprintJS 오픈소스 + localStorage fallback
- 3개 페이지: 게임(index.html), 쿠폰(coupon.html), 관리자(admin.html)
- 라이브: https://leo81673.github.io/lucky_grab/

## 알려진 버그

- 크레인이 공을 잡아 올리지 못하는 버그 (z-index/물리 관련, 다음 세션에서 수정 필요)

## 디자인 시스템

DESIGN.md를 반드시 읽고 UI/시각적 결정을 내릴 것.
폰트, 색상, 스페이싱, 미학적 방향이 모두 정의되어 있음.
명시적인 사용자 승인 없이 DESIGN.md에서 벗어나지 말 것.
QA 모드에서는 DESIGN.md와 맞지 않는 코드를 플래그할 것.

## 규칙

- 모바일 세로 화면 최적화 (주 사용 환경)
- 로그인 없이 즉시 플레이 가능 (진입장벽 최소화)
- 당첨 확률 판정은 반드시 서버에서 (클라이언트 조작 방지)
