import mongoose, { type Mongoose } from "mongoose";
import { env } from "@/lib/env";

// グローバルオブジェクトの型を拡張
declare global {
  var mongooseCache: {
    promise: Promise<Mongoose> | null;
    conn: Mongoose | null;
  };
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      autoIndex: process.env.NODE_ENV !== "production", // prod は明示同期 (npm run sync-indexes) に任せる
    };

    cached.promise = mongoose
      .connect(env.MONGODB_URI, opts)
      .then((mongoose) => {
        return mongoose;
      });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
export default dbConnect;
