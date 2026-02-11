# TODO — すきすぎっ (Suki's Git)

## Phase 1: Foundation

- [x] `src-tauri/src/error.rs` — AppError enum
- [x] `src-tauri/src/types.rs` — Shared data structures
- [x] `src-tauri/src/git/mod.rs` — Module declarations
- [x] `src-tauri/src/usb/mod.rs` — Module declarations
- [x] `src/lib/swr.js` — SWR_KEYS + config
- [x] `src/lib/tauri.js` — invoke wrapper
- [x] `src/lib/elk.js` — ELK layout config
- [x] `src/atoms/uiAtoms.js` — Jotai UI atoms
- [x] `src/context/RepositoryContext.jsx` — Repository context
- [x] `src/i18n/index.js` — i18n initialization
- [x] `src/i18n/locales/en.json` — English translations
- [x] `src/i18n/locales/ko.json` — Korean translations
- [x] `src/i18n/locales/ja.json` — Japanese translations
- [x] `src/styles/global.css` — Global styles
- [x] `src/styles/variables.css` — CSS variables

## Phase 2: Backend Core

- [x] `src-tauri/src/git/repository.rs` — Bare repo open/discover
- [x] `src-tauri/src/git/log.rs` — Commit history (paginated)
- [x] `src-tauri/src/git/refs.rs` — Branches/tags listing
- [x] `src-tauri/src/git/diff.rs` — Unified diff generation (`similar` crate)
- [x] `src-tauri/src/git/dag.rs` — petgraph DAG construction
- [x] `src-tauri/src/commands.rs` — Tauri command handlers

## Phase 3: USB Detection

- [x] Add `sysinfo` dependency
- [x] `src-tauri/src/usb/detect.rs` — USB device enumeration
- [x] `src-tauri/src/usb/watch.rs` — Polling + Tauri events

## Phase 4: Frontend Infrastructure

- [x] `src/hooks/useUsbDevices.js` — USB device hook (+ scanDevice cache update)
- [x] `src/hooks/useRefs.js` — Branches/tags hook
- [x] `src/hooks/useCommitLog.js` — Commit log hook
- [x] `src/hooks/useCommitDag.js` — DAG data hook
- [x] `src/hooks/useDiff.js` — Diff data hook
- [x] `src/components/layout/AppShell.jsx` — Main layout
- [x] `src/components/layout/Sidebar.jsx` — Sidebar navigation
- [x] `src/components/layout/Header.jsx` — Header bar
- [x] `src/components/usb/DeviceList.jsx` — USB device list
- [x] Update `src/App.jsx` — Real app structure
- [x] Update `src/main.jsx` — SWRConfig wrapper
- [x] Update `index.html` — Title change
- [x] Update `src-tauri/src/lib.rs` — Module + command registration
- [x] Update `src-tauri/tauri.conf.json` — Window title/size

## Phase 5-7 (Future)

- [ ] DAG visualization (React Flow + ELK.js)
- [ ] Diff view (react-diff-view)
- [ ] Commit detail panel
- [ ] Infinite scroll
- [ ] Dark mode
- [ ] Error/loading states
