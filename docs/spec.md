# spec.md — 静的版の仕様

## サイト構成（静的）
```
/
├── index.html          # タイトル・難易度選択・チートシート・解答一覧リンク
├── game.html           # ゲーム本体（?level=beginner|intermediate|advanced）
├── solutions.html      # 解答一覧（?level=... で絞り込み、無しで全件）
├── css/style.css       # 既存流用
└── js/
    ├── problems.js     # 問題データ（LEVELS 相当）と PROBLEM_COUNTS
    ├── game.js         # ゲームロジック（出題・判定をローカル化）
    └── solutions.js    # 解答一覧のJS描画
```

## 出題ロジック（旧 /api/problem 相当）
- レベル内の問題から、セッション中に未出題のものを重複なしでランダム選択。
- 全部出し切ったら used をリセットして再利用。
- `question_count` が 5 に達したらクリア（`game_completed = true`）。
- クライアントに渡す情報: description / examples / non_examples / hint1 / hint2 / problem_index。

## 判定ロジック（旧 /api/check 相当）
- 入力された正規表現を JS で `try { new RegExp('^(?:' + pat + ')$') } catch { 無効な正規表現です }`。
- 正解条件: 例文すべてにマッチ（fullmatch） かつ 非例文に一つもマッチしない。
- 不正解時:
  - attempts==1 → hint1、attempts>=2 → hint2 を表示。
  - lives<=1 → 正解パターンを表示。
  - 各例文・非例文のマッチ可否を詳細表示（既存 match_results 相当）。
- 5問目正解で `game_completed = true`。

## Python re と JS RegExp の差分メモ
- `re.fullmatch(pat, s)` ≡ JS `new RegExp('^(?:'+pat+')$').test(s)`。
- ユーザーが `^`/`$` を含むパターンを入力しても二重アンカーになるだけで等価。
- `.` は両者とも改行非マッチ（例文に改行なし）。
- 使用機能（`\d \w \s + * ? {n} {n,m} [] [^] () (?:) (?=) (?!) |`）は JS で互換。

## 受け入れ基準（テスト観点）
- 各レベルの5問について、模範解答パターンが「正解」と判定される。
- 例文に1つでもマッチしない／非例文に1つでもマッチするパターンは「不正解」。
- 無効な正規表現（例: `(` 単体）で「無効な正規表現です」。
- 5問正解でクリアモーダル、ライフ0でゲームオーバーモーダル。
- ページ間遷移（index→game→solutions→index）がリンク/クエリで成立。
