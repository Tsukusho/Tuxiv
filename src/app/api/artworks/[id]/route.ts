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
  await dbConnect();

  const session = await mongoose.startSession();
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

    // DB削除してからGCS削除,トランザクションで囲えないため.
    await session.withTransaction(async () => {
      await Like.deleteMany({ artworkId }).session(session);
      await Bookmark.deleteMany({ artworkId }).session(session);
      await Comment.deleteMany({ artworkId }).session(session);
      await Artwork.findByIdAndDelete(artworkId).session(session);
    });

    const paths:string[] = artwork.images.map((image:{path:string})=>image.path);

    const results = await Promise.allSettled(
      paths.map((p)=>bucket.file(p).delete({ignoreNotFound:true})),
    );

    results.forEach((r,i)=>{
      if (r.status === 'rejected') console.error('GCS削除失敗,孤立）:', paths[i], r.reason);
    });
    return NextResponse.json({ message: "作品を削除しました。" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "作品の削除中にエラーが発生しました。" },
      { status: 500 },
    );
  } finally {
    session.endSession();
  }
}
