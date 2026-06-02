# plan.md — 正規表現インベーダー 静的化＆デプロイ

## 背景
- 現状は Flask アプリ（`app.py`）。サーバー側で出題（`/api/problem`）と正誤判定（`/api/check`）を行っている。
- README には「デプロイ: AWS ECS（予定）」とあるが、ECS はこの規模のアプリには過剰でコストも高い。
- 方針転換: **完全静的化して S3 系（S3 + CloudFront）に置く**。てつてつ判断（2026-05-31）。

## なぜ静的化できるのか
- 正誤判定は「答えのパターン」を使っていない。「ユーザーの正規表現が、例文すべてにマッチし、非例文に一つもマッチしないか」を確認しているだけ。
- この判定は JavaScript の `RegExp` で再現可能。`re.fullmatch(pat, s)` は JS では `new RegExp('^(?:' + pat + ')$').test(s)` で同等。
- 使われている正規表現の機能（`\d` `\w` `+` `*` `{n}` `(?=)` `(?!)` `(?:)` `|` `^` `$`）は JS でも全部サポートされている。

## トレードオフ（静的化で捨てるもの）
- サーバーが答えを隠す設計を捨てる → 問題データ（答え含む）がブラウザの JS に乗るので、開発者ツールで覗けば答えが見える。
- ただし学習用ゲームなので実害は小さい。`solutions.html`（解答一覧）で元々全答えを公開しているため、隠す価値はもともと低い。

## 構成（Phase 分け）
### Phase 1: 静的化リファクタ（Codex 委譲 → Claude レビュー）
1. 問題データ `LEVELS` を JS データファイル（`static/js/problems.js`）に移植。
2. `game.js` の `fetchProblem()` を、サーバー fetch からローカル出題ロジックに置換（未出題から重複なしランダム、5問でクリア）。
3. `game.js` の `checkAnswer()` を、`/api/check` POST からローカル判定に置換（JS RegExp で fullmatch 相当、ヒント・ライフ・マッチ詳細も再現）。
4. 各 HTML から Jinja を除去:
   - `url_for('static', ...)` → 相対パス `css/...` `js/...`
   - `url_for('index')` → `index.html`
   - `url_for('game', level=x)` → `game.html?level=x`
   - `url_for('solutions', level=x)` → `solutions.html?level=x`
   - `{{ level }}`（game.html）→ JS で `URLSearchParams` から取得
5. `solutions.html` の Jinja ループを JS 描画に置換（`static/js/solutions.js` + 同じ `problems.js` を共有）。
6. `templates/` のHTMLをサイトルートへ移動（静的配信できる構成に）。`app.py` / `requirements.txt` / `Dockerfile` を撤去。
7. README を静的構成・S3 デプロイ手順に更新。

### Phase 2: デプロイ基盤（方針決定後）
- 候補A: S3 + CloudFront（OAC）— HTTPS、CloudFront 無料枠、推奨。CDK で IaC 化。
- 候補B: AWS Amplify Hosting — git 連携で最も簡単。
- どちらも AWS 認証が必要（てつてつが手動で `aws login`）。

## 既知の不整合（今回は仕様確認のうえ対応）
- README は「初級50問/中級35問/上級15問」と書くが、`LEVELS` には各5問しかない。`PROBLEM_COUNTS` も50/35/15。実ゲームは5問で終了。
  → 静的化の機会に「実数に合わせる」か「問題を増やす」かを決める。

## Git / リリース運用
- これは構造変更（refactor）なので feature ブランチ + PR が原則。
- ただし現状リモート未設定（master 1コミットのみ）。GitHub リポジトリ作成の要否を別途確認。
