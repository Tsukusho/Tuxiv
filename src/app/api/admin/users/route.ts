import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/user";

// 卒業フラグ管理のドロップダウン用に、全ユーザーの最小情報を返す。
export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  await dbConnect();
  const users = await User.find({})
    .select("username fullName isGraduated")
    .sort({ fullName: 1 })
    .lean();

  return NextResponse.json(users);
}
