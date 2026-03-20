---
description: plan.md, progress.md, CLAUDE.md 및 레퍼런스 문서 정합성 검사 및 업데이트
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(git:*)
---

## Context

- plan.md: !`cat plan.md 2>/dev/null || echo "(없음)"`
- progress.md: !`cat progress.md 2>/dev/null || echo "(없음)"`
- CLAUDE.md: !`cat CLAUDE.md 2>/dev/null || echo "(없음)"`
- 현재 파일 구조: !`find . -name "*.md" -not -path "./.git/*" -not -path "./node_modules/*"`
- 최근 커밋: !`git log --oneline -10`

## Your task

프로젝트 문서들의 정합성을 검사하고 outdated된 내용을 업데이트합니다.

### 1. 현재 코드 상태 파악
- 실제 프로젝트 파일 구조와 기술 스택 확인
- 최근 git 이력에서 변경된 내용 파악

### 2. CLAUDE.md 검증
- "현재 상태" 섹션이 실제 코드와 일치하는지 확인
- 기술 스택, 배포 방식 등이 정확한지 확인
- outdated된 내용 수정

### 3. plan.md 검증
- 계획 항목들이 현재 진행 상황을 반영하는지 확인
- 완료된 계획은 완료 표시
- 새로 결정된 아키텍처/방향이 있으면 반영

### 4. progress.md 검증
- "완료" 항목이 실제 커밋/코드와 일치하는지 확인
- "진행 중" 항목이 현재 상태를 정확히 반영하는지 확인
- "다음" 항목이 plan.md와 일치하는지 확인

### 5. 레퍼런스 문서
- docs/ 또는 references/ 하위 기술 조사 문서가 있으면 outdated 여부 확인
- 없으면 무시

### 6. 결과 보고
- 변경한 파일과 내용을 간결하게 요약
- 변경 없으면 "모든 문서가 최신 상태입니다" 출력
