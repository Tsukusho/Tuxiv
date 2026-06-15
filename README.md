# Tuxiv

サークル・チーム向けの SNS + 日程調整ツール。

## ローカル起動方法
```
npm run dev
```

## 技術スタック

- **Frontend**: Next.js 15 / React 19 / Tailwind CSS
- **Backend**: Next.js API Routes / MongoDB (Mongoose)
- **認証**: JWT + bcrypt
- **ストレージ**: Google Cloud Storage
- **カレンダー**: FullCalendar
- **デプロイ**: Vercel（手動デプロイ、CI/CD なし）

> **Note**: Vercel の設定上、`staging` ブランチが本番ブランチとして運用されています。`master` ブランチは使用していません。
> **Note**: Tuxiv は本来 RDB のほうが適しています（不便をかけてすみません）。このアプリケーションはメディア創成のDB1の授業で「NoSQL DB を使った Web アプリ」の課題として作成したため MongoDB を採用しています。
> 関連の強いデータ（フォロー・いいね・ブックマーク・コメント）を JOIN を持たない MongoDB 上で扱うために、いくつかを手で補っています:
> - **`$in` による手動 JOIN**
> - **`likeCount` / `commentCount` の非正規化カウンタ**
> - **参照整合性をアプリ側で担保**（一部カラムの論理削除で運用）
> - **インデックスの手動同期**（`npm run sync-indexes`。下記参照）
>
> これらは Postgres であれば DB 側で素直に表現できます。余力のある方は **Supabase（Postgres）への移行**を検討ください。

## 主な機能

- 作品の投稿・閲覧・検索（タグ、NSFW,OBOGフィルタリング）
- いいね・ブックマーク・コメント
- フォロー / タイムライン（グローバル / フォロー中）
- ユーザープロフィール
- 日程調整（候補日時の投票）

## セットアップ

```bash
npm install
npm run dev
```

`http://localhost:3000` で起動します。パッケージマネージャは **npm** を使用します（`yarn` は使いません。Vercel も `package-lock.json` を見てビルドするため）。

## 環境変数

`.env.local` を作成し、以下を設定してください:(作成者に聞いてください)

- `MONGODB_URI` - MongoDB 接続文字列
- `JWT_SECRET` - JWT 署名キー
- `SHARED_PASSWORD` - 共有ログインパスワード
- `GCS_PROJECT_ID` - GCP プロジェクト ID
- `GCS_CLIENT_EMAIL` - GCS サービスアカウントのメールアドレス
- `GCS_PRIVATE_KEY` - GCS サービスアカウントの秘密鍵
- `GCS_BUCKET_NAME` - GCS バケット名

## DB インデックス

本番は `autoIndex` を無効化しているため（起動時の意図しないビルドを避けるため）、Mongoose スキーマの index 宣言を変更したら、デプロイ後に同期スクリプトを手動実行する:

```bash
npm run diff-indexes   # スキーマ宣言と実DBの差分をプレビュー（読み取り専用）
npm run sync-indexes   # スキーマ宣言どおりに index を作成・削除
```

`SYNC_DB_NAME=test` のように指定すると、同一クラスタ上の別 DB（本番 `test` / staging `test_staging`）を対象にできる。`sync-indexes` は宣言に無い index を削除するため、先に `diff-indexes` で `toDrop` を確認すること。

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
