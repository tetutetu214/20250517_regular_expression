# 正規表現インベーダーゲーム

正規表現の学習を楽しくするための静的ウェブゲームです。宇宙からの侵略者を正規表現の力で撃退しましょう!

## 機能

- 3つの難易度レベル(初級・中級・上級)
- 1ゲームあたり5問のランダム出題
- ライフシステム(3ライフ)とヒント表示
- インタラクティブなゲームプレイ
- 問題と解答の一覧ページ

## 技術スタック

- HTML / CSS / JavaScript のみ。バックエンドなし
- ホスティング: Cloudflare Pages

過去には Flask + Docker + AWS ECS で構成する想定だったが、ゲームロジックは全てクライアント側で完結できるため、静的サイトに作り直した。

## ローカルでの動作確認

```
python3 -m http.server 8000
```

ブラウザで http://localhost:8000 を開く。

## Cloudflare Pages へのデプロイ

1. このリポジトリを GitHub に push する
2. Cloudflare ダッシュボードの Workers & Pages → Create → Pages → Connect to Git
3. リポジトリを選択
4. ビルド設定:
   - Framework preset: `None`
   - Build command: 空欄
   - Build output directory: `/`
5. Save and Deploy

push するたびに自動でビルド・デプロイされる。

## ディレクトリ構成

```
.
├── index.html         タイトル画面
├── game.html          ゲーム画面
├── solutions.html     問題と解答一覧
└── static/
    ├── css/style.css
    └── js/
        ├── problems.js   問題データと fullMatch ヘルパ
        ├── game.js       ゲーム本体
        └── solutions.js  解答一覧の描画
```
