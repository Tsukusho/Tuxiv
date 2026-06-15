// 実DBの index をスキーマ宣言どおりに揃える (足りない作成 + 宣言に無い余分を削除)。
// prod は autoIndex:false なので、スキーマ変更後にこれを手動実行する。
// autoIndex:false で接続し syncIndexes() で明示的に同期する。
// 実行: npm run sync-indexes (MONGODB_URI は .env.local を参照)
// 注意: syncIndexes は宣言に無い index を DROP する。事前に npm run diff-indexes で toDrop を確認すること。

import mongoose from "mongoose";
import { env } from "@/lib/env";
import "@/models/artwork";
import "@/models/availability";
import "@/models/bookmark";
import "@/models/comment";
import "@/models/follow";
import "@/models/like";
import "@/models/performance";
import "@/models/performanceType";
import "@/models/roleType";
import "@/models/scheduleEvent";
import "@/models/user";
import "@/models/userCalendar";

async function main() {
  const dbName = process.env.SYNC_DB_NAME; // 同一クラスタ上の別DB(例: prod=test)を狙う時に指定
  await mongoose.connect(env.MONGODB_URI, { autoIndex: false, ...(dbName ? { dbName } : {}) });
  console.log("target DB:", mongoose.connection.name);
  const dropped = await mongoose.connection.syncIndexes();
  console.log(dropped); // モデルごとに削除された index 名
  await mongoose.connection.close();
}

main();
