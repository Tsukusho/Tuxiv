import { type NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import UserCalendar from "@/models/userCalendar";
import "@/models/performance";
import "@/models/performanceType";
import "@/models/roleType";
import { getAuthenticatedUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
  }

  await dbConnect();

  const calendar = await UserCalendar.findOne({ userId })
    .populate({
      path: "performances.performanceId",
      populate: { path: "typeId" },
    })
    .populate("performances.roleTypeIds");

  return NextResponse.json(calendar);
}

export async function PUT(request: NextRequest) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
  }

  await dbConnect();

  const { performances } = await request.json();

  if (!Array.isArray(performances)) {
    return NextResponse.json(
      { error: "performances は配列である必要があります" },
      { status: 400 },
    );
  }

  const updated = await UserCalendar.findOneAndUpdate(
    { userId },
    { performances },
    { new: true, upsert: true },
  )
    .populate({
      path: "performances.performanceId",
      populate: { path: "typeId" },
    })
    .populate("performances.roleTypeIds");

  return NextResponse.json(updated);
}
