import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUserId } from "@/lib/auth";
import dbConnect from "@/lib/dbConnect";
import Artwork from "@/models/artwork";

const updateTagsSchema = z.object({
  tags: z
    .array(z.string().trim().min(1, "空のタグは指定できません。").max(50, "タグが長すぎます。"))
    .min(1, "タグを1つ以上指定してください。")
    .max(50, "タグは50個までです。"),
});

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (body === null) {
      return NextResponse.json({ error: "リクエストの形式が正しくありません。" }, { status: 400 });
    }
    const result = updateTagsSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }
    const { tags } = result.data;

    await dbConnect();

    const artwork = await Artwork.findById(id);
    if (!artwork) {
      return NextResponse.json({ error: "作品が見つかりません。" }, { status: 404 });
    }
    if (artwork.userId.toString() !== userId) {
      return NextResponse.json({ error: "編集権限がありません。" }, { status: 403 });
    }

    artwork.tags = tags;
    await artwork.save();
    return NextResponse.json(artwork, { status: 200 });
  } catch (error) {
    console.error("タグ更新エラー:", error);
    return NextResponse.json({ error: "サーバーエラーです。" }, { status: 500 });
  }
}
