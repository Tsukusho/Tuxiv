# Tuxiv

サークル・チーム向けの SNS + 日程調整ツール。


## 技術スタック

- **Frontend**: Next.js 15 / React 19 / Tailwind CSS
- **Backend**: Next.js API Routes / MongoDB (Mongoose)
- **認証**: JWT + bcrypt
- **ストレージ**: Google Cloud Storage
- **カレンダー**: FullCalendar

## 主な機能

- 作品の投稿・閲覧・検索（タグ、NSFW フィルタリング）
- いいね・ブックマーク・コメント
- フォロー / タイムライン（グローバル / フォロー中）
- ユーザープロフィール
- 日程調整（候補日時の投票）

## セットアップ

```bash
npm install
npm run dev
```

`http://localhost:3000` で起動します。

## 環境変数

`.env.local` を作成し、以下を設定してください:

- `MONGODB_URI` - MongoDB 接続文字列
- `JWT_SECRET` - JWT 署名キー
- `GCS_BUCKET_NAME` - GCS バケット名
- `GCS_PROJECT_ID` - GCP プロジェクト ID

## ディレクトリ構成

```
src/
├── app/          # ページ・API ルート
├── components/   # UI コンポーネント
├── lib/          # DB接続等のユーティリティ
├── models/       # Mongoose モデル
└── middleware.ts  # 認証ミドルウェア
migrations/       # DBマイグレーションスクリプト
```
