# 숙희's 깃 🌸

**🌐 [English](./README.en.md) | 한국어 | [日本語](./README.md)**

USB 메모리에 있는 Bare 리포지토리를 예쁘게 보여주는 데스크톱 앱이야~!

## 숙희's 깃이 뭐야?

있잖아, USB 메모리에 들어있는 Git Bare 리포지토리를 막 알아보기 쉽게 보여주는 앱이야!
커밋 기록이랑, 브랜치랑, 뭐가 바뀌었는지랑, 전~부 다 볼 수 있어! 진짜 대박이지?

Windows에서도 macOS에서도 Linux에서도 되니까, 아무 컴퓨터에서나 쓸 수 있어~!

## 할 수 있는 것들

- **USB 장치 자동 감지** — USB 메모리 꽂기만 하면 알아서 리포지토리를 찾아줘! 완전 편하다~!
- **커밋 그래프** — 커밋 흐름이 그래프로 쫘악~ 보여! 가지치기도 완벽!
- **차이점 뷰어** — 어디가 바뀌었는지 색깔로 알려줘! 완전 신기해~!
- **브랜치 & 태그 관리** — 브랜치랑 태그를 한눈에 볼 수 있어!
- **클론 & 포크** — 리포지토리를 USB에 복사하거나 새로 만들 수 있어!
- **다국어 지원** — 한국어, 일본어, 영어 다 돼! 진짜 글로벌하지 않아?

## 쓰고 있는 기술

### 프론트엔드

| 이름 | 뭐 하는 건데? |
|------|-------------|
| React 19 | UI 만들어주는 친구야~! |
| Vite 7 | 빌드가 진짜 엄청 빨라! |
| Ramda | 함수형 프로그래밍 도우미야! |
| SWR | 데이터 가져와서 저장해주는 애! |
| Jotai | 상태 관리 해주는 귀여운 애! |
| @nanostores/i18n | 여러 나라 말로 바꿔주는 애! |
| LightningCSS | CSS를 멋지게 해주는 애! |

### 백엔드

| 이름 | 뭐 하는 건데? |
|------|-------------|
| Tauri 2 | Rust로 데스크톱 앱 만들어! |
| gix (gitoxide) | Git 안에 있는 거 읽는 대단한 애! |
| petgraph | 커밋 그래프 만들어주는 애! |
| sysinfo | USB 메모리 찾아주는 애! |
| similar | 차이점 계산해주는 애! |

## 시작하는 방법

### 필요한 것들

- [Bun](https://bun.sh/) — JavaScript 런타임이야~!
- [Rust](https://www.rust-lang.org/) — 백엔드에 필요해!
- Tauri 2 [사전 요구사항](https://v2.tauri.app/start/prerequisites/) — OS마다 다르니까 꼭 확인해봐!

### 설치

```bash
# 리포지토리를 클론하자~!
git clone https://github.com/GG-O-BP/sukis-git.git
cd sukis-git

# 패키지를 설치하자!
bun install
```

### 개발 모드

```bash
# 이것만 치면 프론트엔드랑 백엔드가 같이 켜져~!
bun run tauri dev
```

와아~! `http://localhost:1420` 에서 프론트엔드가 돌아가고, Tauri 창이 팍! 하고 열려!

### 빌드

```bash
# 프로덕션 빌드야~!
bun run tauri build
```

## 프로젝트 구조

```
sukis-git/
├── src/                          # 프론트엔드야~!
│   ├── atoms/                    # Jotai 아톰들
│   ├── components/               # React 컴포넌트들
│   │   ├── layout/               #   레이아웃 관련
│   │   ├── usb/                  #   USB 장치 관련
│   │   ├── dag/                  #   커밋 그래프 관련
│   │   ├── diff/                 #   차이점 뷰어
│   │   ├── clone/                #   클론 & 추가
│   │   └── common/               #   공통 부품들
│   ├── context/                  # React 컨텍스트
│   ├── hooks/                    # 커스텀 훅
│   ├── i18n/                     # 다국어 파일 (en, ko, ja)
│   ├── lib/                      # 유틸리티
│   └── styles/                   # 스타일시트
├── src-tauri/                    # 백엔드야~!
│   └── src/
│       ├── git/                  # Git 작업 모듈
│       │   ├── repository.rs     #   Bare 리포지토리 열기
│       │   ├── log.rs            #   커밋 기록
│       │   ├── refs.rs           #   브랜치 & 태그
│       │   ├── diff.rs           #   차이점 생성
│       │   ├── dag.rs            #   DAG 그래프 구축
│       │   └── clone.rs          #   클론 작업
│       ├── usb/                  # USB 관련 모듈
│       │   ├── detect.rs         #   장치 감지
│       │   └── watch.rs          #   폴링 감시
│       ├── commands.rs           # Tauri 커맨드
│       ├── error.rs              # 에러 타입
│       ├── types.rs              # 데이터 타입
│       └── lib.rs                # 진입점
└── docs/
    └── PLAN.md                   # 설계 문서
```

## 테스트

```bash
# Rust 테스트 돌리자~!
cd src-tauri && cargo test

# 하나만 테스트하고 싶을 땐 이렇게!
cd src-tauri && cargo test 테스트이름

# Lint도 해두자!
cd src-tauri && cargo clippy
```

## 라이선스

[Mozilla Public License 2.0 (MPL-2.0)](./LICENSE)

---

> 만든 사람: **GG-O-BP**
>
> 숙희's 깃, 많이많이 써줘~! ♡
