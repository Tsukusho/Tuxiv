import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { z } from "zod";
import dbConnect from "@/lib/dbConnect";
import { env } from "@/lib/env";
import User from "@/models/user";

const jwtSchema = z.object({ id: z.string() });

export async function getAuthenticatedUserId(): Promise<string | null> {
  const token = (await cookies()).get("token")?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    const result = jwtSchema.safeParse(decoded);
    if (!result.success) return null;
    return result.data.id;
  } catch {
    return null;
  }
}

// 管理者ゲート。未ログインは 401、ログイン済みだが非管理者は 403 を区別して返す
// (401 はクライアントでログインへ、403 は権限エラー表示、と扱いが分かれるため)
export type AdminGate = { ok: true; userId: string } | { ok: false; status: 401 | 403; error: string };

export async function requireAdmin(): Promise<AdminGate> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { ok: false, status: 401, error: "認証が必要です。" };

  await dbConnect();
  const user = await User.findById(userId).select("isAdmin").lean<{ isAdmin?: boolean }>();
  if (!user?.isAdmin) return { ok: false, status: 403, error: "管理者権限が必要です。" };

  return { ok: true, userId };
}
