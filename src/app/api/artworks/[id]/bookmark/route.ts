import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth";
import dbConnect from "@/lib/dbConnect";
import Bookmark from "@/models/bookmark";

/**
 * ユーザーが特定の作品をブックマーク済みか確認するAPI
 */
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ isBookmarked: false });
    }

    const { id } = await context.params;
    const artworkId = id;

    await dbConnect();
    const existingBookmark = await Bookmark.findOne({ userId, artworkId });
    return NextResponse.json({ isBookmarked: !!existingBookmark });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ isBookmarked: false });
  }
}

/**
 * 作品をブックマークするAPI
 */
export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
    }

    const { id } = await context.params;
    const artworkId = id;

    await dbConnect();

    const existingBookmark = await Bookmark.findOne({ userId, artworkId });
    if (existingBookmark) {
      return NextResponse.json(
        { error: "既にブックマーク済みです。" },
        { status: 409 },
      );
    }

    await Bookmark.create({ userId, artworkId });

    return NextResponse.json(
      { message: "ブックマークしました。" },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "サーバーエラーです。" },
      { status: 500 },
    );
  }
}

/**
 * 作品のブックマークを解除するAPI
 */
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
    }

    const { id } = await context.params;
    const artworkId = id;

    await dbConnect();

    const result = await Bookmark.deleteOne({ userId, artworkId });
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "ブックマークされていません。" },
        { status: 404 },
      );
    }

    return NextResponse.json({ message: "ブックマークを解除しました。" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "サーバーエラーです。" },
      { status: 500 },
    );
  }
}
