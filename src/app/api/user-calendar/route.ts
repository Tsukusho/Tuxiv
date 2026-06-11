import { type NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import UserCalendar from "@/models/userCalendar";
import "@/models/performance";
import "@/models/performanceType";
import "@/models/roleType";

import { z } from "zod";
import { getAuthenticatedUserId } from "@/lib/auth";
import { objectIdSchema } from "@/lib/schemas/db";

const performanceRoleSchema = z.object({
  performanceId: objectIdSchema,
  roleTypeIds: z.array(objectIdSchema).max(20),
});

const userPerformancesSchema = z.object({
  performances: z.array(performanceRoleSchema).max(100),
});

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
  const body = await request.json().catch(() => null);
  if (body === null) {
    return NextResponse.json({ error: "リクエストの形式が正しくありません。" }, { status: 400 });
  }

  const result = userPerformancesSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
  const { performances } = result.data;

  await dbConnect();

  const updated = await UserCalendar.findOneAndUpdate({ userId }, { performances }, { new: true, upsert: true })
    .populate({
      path: "performances.performanceId",
      populate: { path: "typeId" },
    })
    .populate("performances.roleTypeIds");

  return NextResponse.json(updated);
}
