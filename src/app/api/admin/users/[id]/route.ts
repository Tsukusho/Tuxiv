import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/user";

const patchSchema = z.object({ isGraduated: z.boolean() });

// 卒業フラグの更新のみ。卒業者は検索 (events/[id]/search) から除外される。
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  await dbConnect();
  const updated = await User.findByIdAndUpdate(
    id,
    { isGraduated: parsed.data.isGraduated },
    { new: true },
  )
    .select("username fullName isGraduated")
    .lean();

  if (!updated) return NextResponse.json({ error: "対象が見つかりません。" }, { status: 404 });
  return NextResponse.json(updated);
}
