---
description: 세션 종료 — 모든 변경사항 commit, push, deploy
allowed-tools: Bash(git:*), Bash(npm:*), Read, Glob
---

## Context

- Current git status: !`git status`
- Current branch: !`git branch --show-current`
- Recent commits: !`git log --oneline -5`

## Your task

세션을 종료합니다. 아래 단계를 순서대로 실행하세요.

### 1. 변경사항 확인
- git status로 변경된 파일 확인
- 변경사항이 없으면 "변경사항 없음 — 세션을 종료합니다" 출력 후 종료

### 2. progress.md 업데이트
- 이번 세션에서 완료한 작업을 progress.md에 기록
- "진행 중" 항목 중 완료된 것을 "완료"로 이동

### 3. Commit & Push
- 변경된 파일을 모두 stage
- 의미 있는 커밋 메시지 작성 (한국어, 간결하게)
- git push origin (현재 브랜치)

### 4. Deploy
- GitHub Pages 자동 배포이므로 push만으로 충분
- push 완료 후 "배포 트리거됨" 안내

### 5. 종료 메시지
- 이번 세션에서 한 일을 1-3줄로 요약
- "세션을 종료합니다. 수고하셨습니다!" 출력
