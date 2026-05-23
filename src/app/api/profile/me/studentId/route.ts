import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/user";

export async function PATCH(req: Request) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
    }

    const { studentId } = await req.json();

    if (!studentId || !/^\d{9}$/.test(studentId)) {
      return NextResponse.json(
        { error: "学籍番号は9桁の数字で入力してください。" },
        { status: 400 },
      );
    }

    await dbConnect();

    const existing = await User.findOne({ studentId, _id: { $ne: userId } });
    if (existing) {
      return NextResponse.json(
        { error: "この学籍番号は既に使用されています。" },
        { status: 409 },
      );
    }

    const updated = await User.findByIdAndUpdate(
      userId,
      { studentId },
      { new: true },
    );
    if (!updated) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません。" },
        { status: 404 },
      );
    }

    return NextResponse.json({ studentId: updated.studentId });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "サーバーエラーです。" },
      { status: 500 },
    );
  }
}
