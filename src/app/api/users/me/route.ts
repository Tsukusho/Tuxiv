// /src/app/api/users/me/route.ts

import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth";
import dbConnect from "@/lib/dbConnect";
import { bucket } from "@/lib/gcs";
import Artwork from "@/models/artwork";
import Bookmark from "@/models/bookmark";
import Comment from "@/models/comment";
import Follow from "@/models/follow";
import Like from "@/models/like";
import User from "@/models/user";

/**
 * ログイン中のユーザー情報を取得するAPI
 */
export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
    }
    await dbConnect();

    const user = await User.findById(userId).select("-hashedPassword");
    if (!user) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません。" },
        { status: 404 },
      );
    }

    const userObject = user.toObject();

    // プロフィール画像のSigned URLを生成
    let profileImageUrl = null;
    if (user.profileImage?.path) {
      try {
        const options = {
          version: "v4" as const,
          action: "read" as const,
          expires: Date.now() + 15 * 60 * 1000, // 15分
        };
        const [signedUrl] = await bucket
          .file(user.profileImage.path)
          .getSignedUrl(options);
        profileImageUrl = signedUrl;
      } catch (error) {
        console.warn("プロフィール画像のSigned URL生成に失敗:", error);
      }
    }

    return NextResponse.json({
      ...userObject,
      showNSFW: user.showNSFW || false,
      profileImageUrl,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "サーバーエラーです。" },
      { status: 500 },
    );
  }
}

/**
 * ログイン中のユーザー情報を更新するAPI
 */
export async function PUT(req: Request) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
    }
    const body = await req.json();
    await dbConnect();

    const updateData: {
      username?: string;
      fullName?: string;
      hashedPassword?: string;
      mutedTags?: string[];
      showNSFW?: boolean;
    } = {};

    // ユーザー名の更新処理
    if (body.username) {
      const username = body.username.trim();

      // バリデーション
      if (username.length < 2) {
        return NextResponse.json(
          { error: "ユーザー名は2文字以上で入力してください。" },
          { status: 400 },
        );
      }

      // 重複チェック
      const existingUser = await User.findOne({
        username,
        _id: { $ne: userId },
      });
      if (existingUser) {
        return NextResponse.json(
          { error: "このユーザー名は既に使用されています。" },
          { status: 409 },
        );
      }

      updateData.username = username;
    }

    if (body.fullName) updateData.fullName = body.fullName;
    if (body.password) {
      updateData.hashedPassword = await bcrypt.hash(body.password, 10);
    }
    if (body.mutedTags) updateData.mutedTags = body.mutedTags;
    if (body.showNSFW !== undefined) updateData.showNSFW = body.showNSFW;

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    });
    if (!updatedUser) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません。" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      id: updatedUser._id,
      username: updatedUser.username,
      fullName: updatedUser.fullName,
      mutedTags: updatedUser.mutedTags,
      showNSFW: updatedUser.showNSFW,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "サーバーエラーです。" },
      { status: 500 },
    );
  }
}

/**
 * ログイン中のユーザーアカウントを削除するAPI
 */
export async function DELETE() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
  }
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    await dbConnect();

    const userArtworks = await Artwork.find({ userId }).session(session);
    const artworkIds = userArtworks.map((artwork) => artwork._id);
    const deletePromises = userArtworks.flatMap((artwork) =>
      artwork.images.map((image: { path: string }) =>
        bucket.file(image.path).delete(),
      ),
    );
    await Promise.all(deletePromises);

    // 投稿関連データの削除
    if (artworkIds.length > 0) {
      await Like.deleteMany({ artworkId: { $in: artworkIds } }).session(
        session,
      );
      await Bookmark.deleteMany({ artworkId: { $in: artworkIds } }).session(
        session,
      );
      // 投稿に紐づくコメントも削除
      await Comment.deleteMany({ artworkId: { $in: artworkIds } }).session(
        session,
      );
    }

    // ユーザー関連データの削除
    await Like.deleteMany({ userId }).session(session);
    await Bookmark.deleteMany({ userId }).session(session);
    await Follow.deleteMany({
      $or: [{ followerId: userId }, { followingId: userId }],
    }).session(session);

    // ユーザーが投稿したコメントは「削除済みユーザー」として残すため削除しない
    // もしコメントも削除したい場合は以下の行のコメントを外してください
    // await Comment.deleteMany({ userId }).session(session);

    await Artwork.deleteMany({ userId }).session(session);
    await User.findByIdAndDelete(userId).session(session);

    await session.commitTransaction();
    return NextResponse.json({ message: "アカウントを削除しました。" });
  } catch (error) {
    await session.abortTransaction();
    console.error(error);
    return NextResponse.json(
      { error: "アカウントの削除中にエラーが発生しました。" },
      { status: 500 },
    );
  } finally {
    session.endSession();
  }
}
