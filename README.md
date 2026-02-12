# すきすぎっ 🌸

**🌐 [English](./README.en.md) | [한국어](./README.ko.md) | 日本語**

USBメモリのBareリポジトリをかわいく見える化しちゃうデスクトップアプリだよっ！

## すきすぎっ って何？

えっとね、USBメモリに入ってるGitのBareリポジトリを、ぱーっと見やすくしてくれるアプリなの！
コミットの履歴とか、ブランチとか、差分とか、ぜーんぶ見れちゃうんだよ〜！すごいでしょ？

Windows・macOS・Linuxで動くから、どのパソコンでも使えるよっ！

## できること

- **USBデバイスの自動検出** — USBメモリを挿すだけで、中のリポジトリを見つけてくれるの！べんり〜！
- **コミットグラフ** — コミットの流れがグラフでぴゅーって見れるよっ！枝分かれもばっちり！
- **差分ビューア** — どこが変わったのか、色分けして教えてくれるんだ〜！
- **ブランチ＆タグ管理** — ブランチとかタグとかいっぱい見れるよ！
- **クローン＆フォーク** — リポジトリをUSBにコピーしたり、新しく作ったりできちゃう！
- **多言語対応** — 日本語・韓国語・英語に対応してるよっ！

## つかってる技術

### フロントエンド

| なまえ | なにするの？ |
|--------|-------------|
| React 19 | UIをつくるやつだよっ！ |
| Vite 7 | ビルドがちょっぱやなの！ |
| Ramda | 関数型プログラミングのおともだち！ |
| SWR | データをとってきてキャッシュするやつ！ |
| Jotai | 状態管理のちっちゃいおともだち！ |
| @nanostores/i18n | 多言語にしてくれるの！ |
| LightningCSS | CSSをかっこよくするやつ！ |

### バックエンド

| なまえ | なにするの？ |
|--------|-------------|
| Tauri 2 | Rustでデスクトップアプリつくるの！ |
| gix (gitoxide) | Gitの中身を読むすごいやつ！ |
| petgraph | コミットのグラフをつくるの！ |
| sysinfo | USBメモリを見つけるの！ |
| similar | 差分を計算してくれるやつ！ |

## はじめかた

### いるもの

- [Bun](https://bun.sh/) — JavaScriptのランタイムだよっ！
- [Rust](https://www.rust-lang.org/) — バックエンドに必要なの！
- Tauri 2の[前提条件](https://v2.tauri.app/start/prerequisites/) — OSによって違うから確認してね！

### インストール

```bash
# リポジトリをクローンするよっ！
git clone https://github.com/GG-O-BP/sukis-git.git
cd sukis-git

# パッケージをインストールするの！
bun install
```

### 開発モード

```bash
# これだけでフロントエンドもバックエンドも一緒に動くよっ！
bun run tauri dev
```

わーい！ `http://localhost:1420` でフロントエンドが動いて、Tauriのウィンドウがぱっと開くよ！

### ビルド

```bash
# プロダクションビルドだよっ！
bun run tauri build
```

## プロジェクトの構造

```
sukis-git/
├── src/                          # フロントエンドだよっ！
│   ├── atoms/                    # Jotaiのアトム
│   ├── components/               # Reactコンポーネント
│   │   ├── layout/               #   レイアウト系
│   │   ├── usb/                  #   USBデバイス系
│   │   ├── dag/                  #   コミットグラフ系
│   │   ├── diff/                 #   差分ビューア
│   │   ├── clone/                #   クローン＆追加
│   │   └── common/               #   共通パーツ
│   ├── context/                  # Reactコンテキスト
│   ├── hooks/                    # カスタムフック
│   ├── i18n/                     # 多言語ファイル (en, ko, ja)
│   ├── lib/                      # ユーティリティ
│   └── styles/                   # スタイルシート
├── src-tauri/                    # バックエンドだよっ！
│   └── src/
│       ├── git/                  # Git操作モジュール
│       │   ├── repository.rs     #   Bareリポジトリを開くの
│       │   ├── log.rs            #   コミット履歴
│       │   ├── refs.rs           #   ブランチ＆タグ
│       │   ├── diff.rs           #   差分生成
│       │   ├── dag.rs            #   DAGグラフ構築
│       │   └── clone.rs          #   クローン操作
│       ├── usb/                  # USB関連モジュール
│       │   ├── detect.rs         #   デバイス検出
│       │   └── watch.rs          #   ポーリング監視
│       ├── commands.rs           # Tauriコマンド
│       ├── error.rs              # エラー型
│       ├── types.rs              # データ型
│       └── lib.rs                # エントリポイント
└── docs/
    └── PLAN.md                   # 設計ドキュメント
```

## テスト

```bash
# Rustのテストを走らせるよっ！
cd src-tauri && cargo test

# ひとつだけテストしたいときはこうするの！
cd src-tauri && cargo test テスト名

# Lintもやっとこうね！
cd src-tauri && cargo clippy
```

## ライセンス

[Mozilla Public License 2.0 (MPL-2.0)](./LICENSE)

---

> つくったひと：**GG-O-BP**
>
> すきすぎっ、いっぱいつかってねっ！♡
