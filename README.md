# 正規表現インベーダーゲーム

正規表現の学習を楽しくするためのゲームです。宇宙からの侵略者を正規表現の力で撃退しましょう！

## 機能

- 3つの難易度レベル（初級、中級、上級）
- 豊富な問題数（初級50問、中級35問、上級15問）
- ライフシステム
- インタラクティブなゲームプレイ
- 問題と解答の一覧ページ

## 目的

このゲームは正規表現の基礎力向上を目的としています。初級から上級まで段階的に学習することで、正規表現の理解を深めることができます。

## 技術スタック

- バックエンド: Python + Flask
- フロントエンド: HTML, CSS, JavaScript
- コンテナ化: Docker
- デプロイ: AWS ECS (予定)

## ローカルでの実行方法

1. リポジトリをクローン
```
git clone <リポジトリURL>
cd regex_invaders
```

2. 仮想環境を作成して有効化（オプション）
```
python -m venv venv
# Windowsの場合
venv\Scripts\activate
# macOS/Linuxの場合
source venv/bin/activate
```

3. 依存関係をインストール
```
pip install -r requirements.txt
```

4. アプリケーションを実行
```
python app.py
```

5. ブラウザで http://localhost:5000 にアクセス

## Dockerでの実行方法

1. Dockerイメージをビルド
```
docker build -t regex-invaders .
```

2. コンテナを実行
```
docker run -p 5000:5000 regex-invaders
```

3. ブラウザで http://localhost:5000 にアクセス

## AWS ECSへのデプロイ（予定）

1. ECRリポジトリを作成
2. Dockerイメージをビルドしてプッシュ
3. ECSクラスターとサービスを設定
4. タスク定義を作成してデプロイ

詳細な手順は今後追加予定です。