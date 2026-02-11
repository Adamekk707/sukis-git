# すきすぎっ (Suki's Git) — Architecture & Implementation Plan

## Overview

USB 장치의 Bare Repository에서 Git 형상관리를 시각화하는 크로스 플랫폼 Tauri 데스크톱 앱.

## Architecture

```
┌─────────────────────────────────────────────┐
│                  Frontend                    │
│  React 19 + React Flow + ELK.js + Ramda     │
│                                              │
│  State: Jotai (UI) / SWR (server) / Context │
│  i18n: @nanostores/i18n (en, ko, ja)        │
│  Styles: LightningCSS                        │
├─────────────────────────────────────────────┤
│              Tauri IPC Bridge                │
│        invoke() / listen() / emit()          │
├─────────────────────────────────────────────┤
│                Rust Backend                   │
│                                              │
│  Git Ops: gix (gitoxide)                     │
│  DAG:     petgraph                           │
│  USB:     sysinfo + polling                  │
│  Serde:   serde + serde_json                 │
└─────────────────────────────────────────────┘
```

## Module Structure

### Rust Backend (`src-tauri/src/`)

```
lib.rs              — Tauri app builder, command registration
error.rs            — AppError enum (Git, IO, Path, USB)
types.rs            — Serializable IPC data structures
commands.rs         — #[tauri::command] async handlers

git/
  mod.rs            — module declarations
  repository.rs     — bare repo open/discover
  log.rs            — commit history (paginated)
  refs.rs           — branches/tags listing
  diff.rs           — unified diff generation
  dag.rs            — petgraph DAG construction

usb/
  mod.rs            — module declarations
  detect.rs         — sysinfo-based removable disk detection
  watch.rs          — 3s polling + Tauri event emission
```

### Frontend (`src/`)

```
main.jsx                          — React root + SWRConfig
App.jsx                           — RepositoryProvider + AppShell

atoms/uiAtoms.js                  — Jotai atoms (sidebar, selectedCommit, etc.)
context/RepositoryContext.jsx     — selectedRepoPath, selectedRef

lib/swr.js                        — SWR_KEYS constants + config
lib/tauri.js                      — invoke wrapper
lib/elk.js                        — ELK layout configuration

hooks/
  useUsbDevices.js                — USB device list + event listener
  useRefs.js                      — branches/tags
  useCommitLog.js                 — paginated commit history
  useCommitDag.js                 — DAG data
  useDiff.js                      — diff text

components/
  layout/AppShell.jsx             — sidebar + main content frame
  layout/Sidebar.jsx              — device/repo/branch navigation
  layout/Header.jsx               — title, locale switch, sidebar toggle
  usb/DeviceList.jsx              — USB device list UI

i18n/
  index.js                        — createI18n initialization
  locales/{en,ko,ja}.json         — translation files

styles/
  global.css                      — global styles
  variables.css                   — CSS custom properties
```

## Implementation Phases

### Phase 1: Foundation ✅
- Error types, shared data structures, module skeleton
- Frontend directory structure, SWR config, i18n setup

### Phase 2: Backend Core ✅
- Git operations via gix: open, log, refs, diff, DAG
- Tauri command handlers

### Phase 3: USB Detection ✅
- sysinfo-based removable disk enumeration
- Background polling with Tauri event emission

### Phase 4: Frontend Infrastructure ✅
- SWR hooks for all backend queries
- Layout components (AppShell, Sidebar, Header)
- i18n integration, RepositoryContext

### Phase 5: DAG Visualization (future)
- React Flow + ELK.js commit graph

### Phase 6: Diff View (future)
- react-diff-view integration

### Phase 7: Polish (future)
- Error states, dark mode, infinite scroll

## Implementation Notes

### gix 0.79 API
- `CommitRef::author`/`committer`는 `SignatureRef`가 아닌 raw `&BStr`. 수동 파싱 필요 (`parse_signature()` in `log.rs`, `parse_author_info()` in `dag.rs`)
- `rev_walk().sorting()` — `CommitTimeOrder`가 private이므로 사용 불가, 기본 정렬 사용
- Tree diff API가 콜백 기반으로 복잡 → `similar` crate로 대체하여 unified diff 생성

### Ramda.js JSX 주의사항
- `R.when`을 JSX에서 사용하면 조건 불만족 시 원본 값을 그대로 반환하여 "Objects are not valid as a React child" 에러 발생 가능 → `R.ifElse`로 대체

### USB 스캔 흐름
- `list_usb_devices()` → 디바이스 목록 (repositories 비어 있음)
- `scan_usb_device(mount_point)` → 해당 디바이스의 bare repo 탐색 결과 반환
- 스캔 결과는 `useUsbDevices.scanDevice()`를 통해 SWR 캐시에 반영
