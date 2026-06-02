# todo.md

## 進行中
- [x] 方針確認（てつてつ）: 静的化リファクタの計画レビュー
- [x] 理解度テスト（静的ホスティング / クライアント側正規表現判定）3問正解

## Phase 1: 静的化リファクタ（完了 2026-05-31）
- [x] problems.js に問題データを移植
- [x] game.js の出題ロジックをローカル化（regex-core.js の純関数に切り出し）
- [x] game.js の判定ロジックをローカル化（JS RegExp fullmatch 相当）
- [x] HTML から Jinja 除去（相対パス + クエリ文字列）
- [x] solutions.js で解答一覧を JS 描画
- [x] HTML をルートへ移動、app.py/requirements.txt/Dockerfile 撤去
- [x] README を静的構成に更新
- [x] ローカル静的サーバーで動作確認（python -m http.server で全ページ200）
- [x] 15問の模範解答が正解判定になるかテスト（node tests/ 全10件パス）
- [ ] ブラウザ実機での体感確認（任意）

## Phase 1.5: PR（完了 2026-05-31）
- [x] refactor/static-hosting を push、PR #1 作成
  - https://github.com/tetutetu214/20250517_regular_expression/pull/1
- [ ] PR レビュー・master へマージ（てつてつ）

## Phase 2: デプロイ（S3 + CloudFront / CDK）
- [x] ホスティング方式決定: S3 + CloudFront（CDK で IaC）
- [ ] CDK スタック作成（S3 非公開 + CloudFront OAC + BucketDeployment）※Codex 委譲予定
- [ ] デプロイ前の理解度テスト（変更内容/影響コスト/ロールバック）
- [ ] てつてつが手動 aws login → cdk deploy
- [ ] 動作確認（CloudFront ドメインで全ページ）

## 保留・要確認
- [ ] 問題数の不整合（README 50/35/15 vs 実データ各5問）をどうするか
- [ ] 既存 feature/cloudflare-static-migration ブランチの扱い（不要なら削除）
