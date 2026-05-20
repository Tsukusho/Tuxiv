# Tuxiv

サークル・チーム向けの SNS + 日程調整ツール。

## ローカル起動方法
```
.\node_modules\.bin\next dev
```

## 技術スタック

- **Frontend**: Next.js 15 / React 19 / Tailwind CSS
- **Backend**: Next.js API Routes / MongoDB (Mongoose)
- **認証**: JWT + bcrypt
- **ストレージ**: Google Cloud Storage
- **カレンダー**: FullCalendar
- **デプロイ**: Vercel（手動デプロイ、CI/CD なし）

> **Note**: Vercel の設定上、`staging` ブランチが本番ブランチとして運用されています。`master` ブランチは使用していません。
> **Note**: TuxivにはRDBのほうが適しています。不便をかけてすみません。授業の課題でNoSQLDBを使ったWebアプリケーションを作れという課題の一環で制作したためです。余力のある方はSupabaseへのReplaceを検討ください。

## 主な機能

- 作品の投稿・閲覧・検索（タグ、NSFW,OBOGフィルタリング）
- いいね・ブックマーク・コメント
- フォロー / タイムライン（グローバル / フォロー中）
- ユーザープロフィール
- 日程調整（候補日時の投票）

## セットアップ

```bash
npm install
yarn dev
```

`http://localhost:3000` で起動します。

## 環境変数

`.env.local` を作成し、以下を設定してください:(作成者に聞いてください)

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
