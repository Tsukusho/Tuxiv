// /src/app/api/artworks/[id]/route.ts

import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth";
import dbConnect from "@/lib/dbConnect";
import { bucket } from "@/lib/gcs";
import Artwork from "@/models/artwork";
import Bookmark from "@/models/bookmark";
import Comment from "@/models/comment";
import Like from "@/models/like";
import User from "@/models/user";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();
    const { id } = await context.params;

    const artwork = await Artwork.findById(id).populate({
      path: "userId",
      select: "username",
      model: User,
    });

    if (!artwork) {
      return NextResponse.json(
        { error: "作品が見つかりません。" },
        { status: 404 },
      );
    }

    const artworkObject = artwork.toObject();
    if (artwork.isAnonymous) {
      delete artworkObject.userId;
    }

    return NextResponse.json(artworkObject);
  } catch (error) {
    console.error("Failed to fetch artwork:", error);
    return NextResponse.json(
      { error: "サーバーエラーです。" },
      { status: 500 },
    );
  }
}

/**
 * 作品を削除するAPI
 */
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "認証が必要です。" },
        { status: 401 },
      );
    }

    const { id } = await context.params;
    const artworkId = id;

    await dbConnect();

    const artwork = await Artwork.findById(artworkId).session(session);
    if (!artwork) {
      return NextResponse.json(
        { error: "作品が見つかりません。" },
        { status: 404 },
      );
    }

    // 投稿者本人か確認
    if (artwork.userId.toString() !== userId) {
      return NextResponse.json(
        { error: "削除する権限がありません。" },
        { status: 403 },
      );
    }

    // 1. GCSから画像ファイルを削除
    const deletePromises = artwork.images.map((image: { path: string }) =>
      bucket.file(image.path).delete(),
    );
    await Promise.all(deletePromises);

    // 2. 関連データを削除
    await Like.deleteMany({ artworkId }).session(session);
    await Bookmark.deleteMany({ artworkId }).session(session);
    await Comment.deleteMany({ artworkId }).session(session); // コメントも削除

    // 3. 作品自体を削除
    await Artwork.findByIdAndDelete(artworkId).session(session);

    await session.commitTransaction();
    return NextResponse.json({ message: "作品を削除しました。" });
  } catch (error) {
    await session.abortTransaction();
    console.error(error);
    return NextResponse.json(
      { error: "作品の削除中にエラーが発生しました。" },
      { status: 500 },
    );
  } finally {
    session.endSession();
  }
}
