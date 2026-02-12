# Suki's Git 🌸

**🌐 English | [한국어](./README.ko.md) | [日本語](./README.md)**

It's a desktop app that shows you the Bare repositories on your USB stick in a really pretty way!

## What's Suki's Git?

So basically right, it's this app that takes all the Git Bare repositories on your USB memory stick and makes them dead easy to look at!
You can see commit history, branches, what's changed and everything! Isn't that proper brilliant?

It works on Windows, macOS and Linux too, so you can use it on any computer you like!

## What it can do

- **Automatic USB detection** — Just pop your USB stick in and it finds all the repositories for you! So handy!
- **Commit graph** — You can see how all the commits flow in a lovely graph! Branches and everything!
- **Diff viewer** — It shows you what's changed with pretty colours! How clever is that!
- **Branch & tag management** — You can see all your branches and tags at a glance!
- **Clone & fork** — You can copy repositories to your USB or make brand new ones!
- **Multiple languages** — It speaks English, Korean and Japanese! Proper cosmopolitan innit!

## The tech we're using

### Frontend

| Name | What does it do? |
|------|-----------------|
| React 19 | It builds all the pretty UI bits! |
| Vite 7 | Makes building ever so fast! |
| Ramda | Our functional programming bestie! |
| SWR | Fetches data and keeps it cached! |
| Jotai | A cute little state manager! |
| @nanostores/i18n | Makes everything multilingual! |
| LightningCSS | Makes the CSS look ace! |

### Backend

| Name | What does it do? |
|------|-----------------|
| Tauri 2 | Builds desktop apps with Rust! |
| gix (gitoxide) | Reads all the Git stuff! Dead clever! |
| petgraph | Makes the commit graphs! |
| sysinfo | Finds your USB sticks! |
| similar | Works out all the differences! |

## Getting started

### What you'll need

- [Bun](https://bun.sh/) — It's a JavaScript runtime!
- [Rust](https://www.rust-lang.org/) — You need this for the backend!
- Tauri 2 [prerequisites](https://v2.tauri.app/start/prerequisites/) — It's different for each OS, so do check!

### Installation

```bash
# Let's clone the repository!
git clone https://github.com/GG-O-BP/sukis-git.git
cd sukis-git

# Now install all the packages!
bun install
```

### Development mode

```bash
# Just type this and the frontend AND backend start together! Magic!
bun run tauri dev
```

Yay! The frontend runs at `http://localhost:1420` and the Tauri window pops right open!

### Building

```bash
# Production build time!
bun run tauri build
```

## Project structure

```
sukis-git/
├── src/                          # The frontend bit!
│   ├── atoms/                    # Jotai atoms
│   ├── components/               # React components
│   │   ├── layout/               #   Layout stuff
│   │   ├── usb/                  #   USB device stuff
│   │   ├── dag/                  #   Commit graph stuff
│   │   ├── diff/                 #   Diff viewer
│   │   ├── clone/                #   Clone & add
│   │   └── common/               #   Shared bits
│   ├── context/                  # React context
│   ├── hooks/                    # Custom hooks
│   ├── i18n/                     # Language files (en, ko, ja)
│   ├── lib/                      # Utilities
│   └── styles/                   # Stylesheets
├── src-tauri/                    # The backend bit!
│   └── src/
│       ├── git/                  # Git operations module
│       │   ├── repository.rs     #   Opening Bare repositories
│       │   ├── log.rs            #   Commit history
│       │   ├── refs.rs           #   Branches & tags
│       │   ├── diff.rs           #   Generating diffs
│       │   ├── dag.rs            #   Building the DAG graph
│       │   └── clone.rs          #   Clone operations
│       ├── usb/                  # USB related module
│       │   ├── detect.rs         #   Device detection
│       │   └── watch.rs          #   Polling & watching
│       ├── commands.rs           # Tauri commands
│       ├── error.rs              # Error types
│       ├── types.rs              # Data types
│       └── lib.rs                # Entry point
└── docs/
    └── PLAN.md                   # Design document
```

## Testing

```bash
# Let's run the Rust tests!
cd src-tauri && cargo test

# If you only want to run one test, do this!
cd src-tauri && cargo test test_name

# Don't forget the lint!
cd src-tauri && cargo clippy
```

## Licence

[Mozilla Public License 2.0 (MPL-2.0)](./LICENSE)

---

> Made by: **GG-O-BP**
>
> Please use Suki's Git loads and loads! ♡
