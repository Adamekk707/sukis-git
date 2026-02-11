# CLAUDE.md

## Project Overview

すきすぎっ ("Suki's git") — **크로스 플랫폼** Tauri 데스크톱 앱. USB 장치의 Bare Repository를 대상으로 Git 형상관리를 시각화한다. Rust 백엔드(Tauri) + React 프론트엔드(함수형 프로그래밍) 구조.

## Commands

```bash
# Frontend
bun dev                          # Vite dev server (port 1420)
bun run build                    # Production build

# Tauri
bun tauri dev                    # 개발 모드 (bun dev 자동 실행)
bun tauri build                  # 프로덕션 빌드

# Rust
cd src-tauri && cargo test       # 전체 테스트
cd src-tauri && cargo test <name> # 단일 테스트
cd src-tauri && cargo clippy     # Lint
```

## Code Style — MUST Follow

### Ramda.js (IMPORTANT)

**모든 프론트엔드 코드에서 Ramda 사용이 필수.** 네이티브 JavaScript 메서드 대신 Ramda를 사용할 것.

- `import * as R from "ramda"` 형태로 import
- 조건문: `R.ifElse`, `R.when`, `R.cond` (not `if/else`)
- Null/Empty 체크: `R.isNil`, `R.isEmpty` (not `=== null`, `.length > 0`)
- 프로퍼티 접근: `R.prop`, `R.path`, `R.propOr`, `R.pathOr` (not dot notation)
- 배열 연산: `R.map`, `R.filter`, `R.find`, `R.reduce` (not native methods)
- 비교: `R.equals`, `R.propEq`, `R.gt`, `R.lt`
- 함수 합성: `R.pipe`, `R.compose`
- 기본값: `R.defaultTo` (not `|| default`)

### Self-Documenting Code

- **JSDoc 금지**, **인라인 주석 금지** — 명확한 네이밍으로 대체
- 예외: 복잡한 알고리즘이나 비직관적 비즈니스 로직에만 간략한 설명 허용

## Architecture — Key Decisions

### Frontend State Management (우선순위 순)

1. **Jotai atoms** (`src/atoms/`) — 모달 상태, 단순 UI 상태
2. **SWR** (`src/lib/swr.js`) — 서버 상태, 데이터 페칭 + 캐싱
3. **React Context** — 복합 상태 (리포지토리, 브랜치, 커밋 그래프)

SWR 키는 반드시 `SWR_KEYS` (`src/lib/swr.js`)를 사용할 것. 변이 후 `mutate(SWR_KEYS.KEY)`로 revalidation.

### Git Operations — Rust Only

모든 Git 연산은 Rust 백엔드에서 처리. 프론트엔드는 UI 렌더링에 집중, Rust가 bare repository 접근과 Git 데이터 파싱을 담당.

- Bare repository 탐색 → `git/repository.rs`
- 커밋 히스토리 → `git/log.rs`
- 브랜치/태그 관리 → `git/refs.rs`
- Diff 연산 → `git/diff.rs`
- USB 파일시스템 변경 감지 → `usb/`

### Commit DAG Visualization

Rust `petgraph`로 커밋 DAG 구조를 구성하여 프론트엔드에 전달. 프론트엔드는 React Flow + ELK.js로 자동 레이아웃 및 시각화.

### i18n

`@nanostores/i18n` 사용. 로케일 파일: `src/i18n/locales/` (en, ko, ja). `useStore(messages)`로 번역 접근.

## Rust Development Rules

- 모든 Tauri 커맨드: `async fn` → `Result<T, String>` 반환
- `#[tauri::command]` 매크로 사용, `lib.rs`에 등록
- Git 연산: `gitoxide` (`gix`) crate (직접 파일 파싱 금지, `git2` 사용 금지)
- 직렬화: `serde` + `serde_json`
- DAG 구조: `petgraph`
- 파일시스템 감시: `notify`
- 반복: zip 패턴 선호 (인덱스 기반 지양)
- 테스트: 모듈 내 `#[cfg(test)]` 인라인

## Frontend Libraries

- **React Flow** + **ELK.js** — 커밋 DAG 시각화 + 자동 레이아웃
- **react-diff-view** — Diff 렌더링 (구문 강조 포함)
- **Ramda** — 함수형 유틸리티

## Gotchas

- **Bare Repository**: working tree가 없음 — `gix::open()` 시 bare repo 옵션 사용. 일반 repo로 열지 말 것
- **USB 경로**: 드라이브 문자/마운트 포인트가 변경될 수 있음 — Volume Label 또는 UUID로 장치 식별
- **크로스 플랫폼 경로**: `std::path::PathBuf` 사용. 경로 구분자 하드코딩 금지
- **대용량 리포지토리**: 커밋 로그 lazy loading 필수 — 전체 히스토리를 한 번에 로드하지 말 것
- **Tauri invoke**: 항상 `await`. 데이터 페칭은 `useSWR`, 변이는 `useSWRMutation`
- **CSS**: LightningCSS 사용 (PostCSS 플러그인 사용 금지)
- **React 19**: concurrent features 활성화 상태
- **패키지 매니저**: Bun 사용
- **Tauri 플러그인**: `@tauri-apps/plugin-opener`
- **스토리지**: 백엔드는 앱 데이터 디렉토리(`tauri::api::path::app_data_dir`)에 네이티브 파일 I/O
