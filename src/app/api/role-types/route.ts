import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth";
import dbConnect from "@/lib/dbConnect";
import RoleType from "@/models/roleType";

export async function GET() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
  }

  await dbConnect();
  const types = await RoleType.find({ isActive: true }).sort({ order: 1 });
  return NextResponse.json(types);
}
