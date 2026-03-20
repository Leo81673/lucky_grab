---
description: 프리뷰 배포 후 QR 코드 URL 안내
allowed-tools: Bash(git:*), Bash(gh:*), Bash(npx:*), Read, Agent
---

## Context

- Current branch: !`git branch --show-current`
- Git status: !`git status --short`

## Your task

현재 코드를 프리뷰 환경에 배포하고 접속 URL을 안내합니다.

### 1. 변경사항 커밋
- 커밋되지 않은 변경사항이 있으면 먼저 커밋
- 프리뷰 브랜치가 아니면 새 브랜치 생성

### 2. Push & 배포
- GitHub Pages는 브랜치 기반 배포이므로, 프리뷰 브랜치를 push
- 또는 deploy.yml에 해당 브랜치가 트리거 대상인지 확인

### 3. URL 안내
- 배포 완료 후 접속 URL을 명확하게 안내
- QR 코드 생성이 가능하면 QR 이미지 URL도 제공 (https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=URL)
