# 다른 컴퓨터(Windows)에서 이어서 작업하기

모든 코드와 커밋은 GitHub(`ggamzie317/amc-decision-architecture`)에 있다. 새 컴퓨터는 이 저장소를 받아서 바로 이어갈 수 있다.
작업 상태와 규칙은 [CURRENT_STATE.md](CURRENT_STATE.md)에 있다.

## 방법 A: 클라우드 (설치 없이)

claude.ai/code(Claude Code on the web)에서 이 GitHub 저장소를 열면 어떤 컴퓨터에서든 설치 없이 작업할 수 있다.
코드 수정, 테스트, PR 작성까지 클라우드에서 한다. 운영 사이트 확인은 브라우저로 하면 된다.

## 방법 B: Windows 노트북에 설치

### 1. 설치할 것

| 도구 | 버전 | 비고 |
|---|---|---|
| Git for Windows | 최신 | Git Bash 포함. 저장소의 `scripts/*.sh`는 Git Bash에서 실행 |
| Git LFS | 최신 | `templates/*.docx`가 LFS로 저장됨. 설치 후 `git lfs install` 한 번 |
| Node.js | 24.x (맥북 24.13.1, CI는 20) | |
| pnpm | 10.x | Node 설치 후 `corepack enable`이면 `package.json`의 `pnpm@10.4.1`을 자동 사용 |
| GitHub CLI (`gh`) | 최신 | `gh auth login`으로 로그인 (PR 생성·확인용) |
| Claude 데스크톱 앱 | 최신 | Code 탭에서 저장소 폴더를 열어 작업 |
| Python 3 | 선택 | 원래 보고서 엔진(`src/*.py`) 작업 시에만 |

### 2. Git 설정 (한 번)

Git Bash에서:

```bash
git config --global core.autocrlf false
git config --global core.longpaths true
git lfs install
```

저장소의 `.gitattributes`가 줄바꿈을 LF로 고정하므로 Windows에서도 테스트가 맥과 같게 돈다.

### 3. 저장소 받기

```bash
git clone https://github.com/ggamzie317/amc-decision-architecture.git
cd amc-decision-architecture
cd manus-ui
corepack enable
pnpm install --frozen-lockfile
```

### 4. 확인 (맥과 같은 결과가 나와야 함)

`manus-ui` 폴더에서:

```bash
npx tsc --noEmit
npx vite build
npx vitest run --root .. manus-ui/tests
```

- `vite build`를 먼저 해야 공개 번들 개인정보 테스트(`public-bundle-privacy`)가 통과한다.
- 2026-10-18 기준 전체 707개 테스트 통과.

### 5. 비밀값

- 저장소에는 비밀값이 없고, 테스트는 비밀값 없이 돈다.
- 운영 비밀값(Perplexity 키, DB 연결 문자열, 관리자 비밀번호, AI Gateway)은 Vercel 프로젝트 환경변수에만 있다. 로컬에서 실제 외부 호출이 필요할 때만 Vercel 대시보드에서 확인하고, 파일로 저장하더라도 `.env*`는 커밋하지 않는다.
- 저장소는 공개(public)이므로 비밀값·고객 데이터를 커밋하지 않는다.

### 6. 작업 방식

- `main`에서 새 브랜치를 만들어 작업하고 PR을 올린다. `main` 병합은 곧 운영 배포다(소유자 승인 필요).
- 맥북에서는 `~/amc-worktrees/<작업명>` 형태로 브랜치별 폴더(git worktree)를 썼다. Windows에서는 한 폴더에서 브랜치를 바꿔도 된다.

## 맥북에만 있는 것 (GitHub에 없음)

- `~/amc-worktrees/v2-launch-hardening/launch-check-2026-10-16/` (약 290MB): 런칭 점검 PDF·페이지 이미지·QA 결과, 레거시 기록 건수·삭제 스크립트. 결과 요약은 `docs/launch-check-2026-10-16.md`에 있다.
- `~/amc-decision-architecture/output/`, `manus-ui/output/`: 예전 QA 보고서 산출물(docx/pdf/json). 다시 생성 가능.
- 맥북 Claude 메모리: 내용은 [CURRENT_STATE.md](CURRENT_STATE.md)로 옮김.
