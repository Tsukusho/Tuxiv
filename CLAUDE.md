# CLAUDE.md

Tuxiv — Next.js (App Router) + MongoDB/Mongoose のサークル向け Web アプリ。

## ファイル戦略 (重要)

**colocation > 早すぎる集約**。機能で使うコードはその機能フォルダ内に置く。
`src/lib` / `src/components` に上げるのはアプリ全体で本当に共有するものだけ。
詳細・実例は [docs/architecture.md](docs/architecture.md)。

### App Router フィーチャ構成

`src/app/<feature>/` 配下を `_` 始まりの private フォルダで分離する:

```
_components/  view component
_hooks/       データ層。query.ts (fetchClient バインド) + useXxx.ts (フック)
_types/       機能ローカルの型
page.tsx / layout.tsx
```

- データ層 (`_hooks`) は取得・更新・キャッシュ無効化のみ。UI を知らない。
- 表示層 (`_components`) の副作用は `mutate(vars, { onSuccess, onError })` で注入。
- API のルート間共有ロジックは `src/app/api/<feature>/_xxx.ts` に colocate (lib に上げない)。

### アプリ全体共有 (= lib に置く例外)

- `lib/fetchClient.ts` — `!res.ok` を `ApiError(status, body)` で throw する fetch ラッパ。
- `lib/auth.ts` — `getAuthenticatedUserId()` / `requireAdmin()` (401/403 を区別)。
- `components/QueryProvider.tsx` — QueryClient の `onError` で 401→`/login` を**集約**。
  データ取得は `useQuery({ queryFn: () => fetchClient(url) })` にするだけで 401 が自動でログインへ飛ぶ。

## DB / マイグレーション

- 本番 DB = Atlas `tuxiv-cluster` の **`test`** データベース (staging = `test_staging`)。`.env.local` の `MONGODB_URI` 参照。
- `migrations/*.js` は **mongosh スクリプトを手動実行**。フレームワーク・適用台帳なし → 適用状況は実 DB を直接確認する。
- スキーマ移行は Expand→Contract (Phase A: 追加のみ / Phase B: 旧フィールド削除)。詳細 [docs/er-diagram.md](docs/er-diagram.md) / [docs/migration-plan.md](docs/migration-plan.md)。
- マスタ (PerformanceType / RoleType) は**論理削除** (`isActive:false`)。物理削除しない (UserCalendar が `_id` 参照するため)。

## コーディング規約

- import 順: 外部パッケージ → `@/` エイリアス → 相対。保存時に自動整形される。
- 変数名は状態を素直に表す (`hasX` / `isY`)。`needs` / `should` / `must` は避ける。
- 一回実行スクリプト (migration 等) に過剰な防御コード (統計出力・存在チェック等) を書かない。
