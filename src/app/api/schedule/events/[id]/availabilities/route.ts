import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth";
import dbConnect from "@/lib/dbConnect";
import Availability from "@/models/availability";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;
  try {
    // 認証チェック
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
    }

    await dbConnect();
    const eventId = params.id;

    // リクエストボディからデータを取得
    const { name, grade, roles, availableSlots, lastInputDate } =
      await request.json();

    // availableSlotsの各スロットにtypeフィールドが存在することを確認
    const slotsWithType = availableSlots.map(
      (slot: { start: string; end: string; type?: string }) => ({
        start: slot.start,
        end: slot.end,
        type: slot.type || "available", // 明示的にデフォルト値を設定
      }),
    );

    const validTypes = ["available", "undecided", "online"];
    const invalidSlots = slotsWithType.filter(
      (s: { type: string }) => !validTypes.includes(s.type),
    );
    if (invalidSlots.length > 0) {
      return NextResponse.json(
        { message: "無効なステータスタイプが含まれています" },
        { status: 400 },
      );
    }

    // "Upsert"処理: データがあれば更新、なければ新規作成
    const updatedAvailability = await Availability.findOneAndUpdate(
      {
        eventId: eventId,
        userId: userId,
      },
      {
        name,
        grade,
        roles,
        availableSlots: slotsWithType, // 処理後のデータを使用
        lastInputDate: lastInputDate ? new Date(lastInputDate) : undefined,
      },
      {
        new: true, // trueにすると、更新後のドキュメントを返す
        upsert: true, // trueにすると、データが見つからない場合に新規作成する
      },
    );

    return NextResponse.json(updatedAvailability, { status: 200 });
  } catch (error) {
    console.error("出欠情報保存エラー:", error);
    return NextResponse.json(
      { message: "サーバーエラーが発生しました" },
      { status: 500 },
    );
  }
}
