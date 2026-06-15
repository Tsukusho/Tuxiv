// ドライラン: 実DBとスキーマ宣言の index 差分を表示するだけ (適用しない・読み取り専用)。
// toCreate=作成される index / toDrop=削除される index 名。sync 前に toDrop を必ず確認する。
// autoIndex:false で接続するので、接続しただけで index が作られることはない。
// 実行: npm run diff-indexes (MONGODB_URI は .env.local を参照)

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
  for (const name of mongoose.connection.modelNames()) {
    const diff = await mongoose.model(name).diffIndexes();
    console.log(name, JSON.stringify(diff));
  }
  await mongoose.connection.close();
}

main();
