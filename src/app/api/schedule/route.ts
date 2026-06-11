import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth";
import dbConnect from "@/lib/dbConnect";
import ScheduleEvent from "@/models/scheduleEvent";

export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
    }

    await dbConnect();
    const event = await ScheduleEvent.findOne().sort({ createdAt: -1 }).lean();

    return NextResponse.json({ event }, { status: 200 });
  } catch (error) {
    console.error("イベント取得エラー:", error);
    return NextResponse.json({ message: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
