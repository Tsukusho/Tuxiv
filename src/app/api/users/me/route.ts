// /src/app/api/users/me/route.ts

import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUserId } from "@/lib/auth";
import dbConnect from "@/lib/dbConnect";
import { isDuplicateKeyError } from "@/lib/dbError";
import { bucket } from "@/lib/gcs";
import { fullNameSchema, passwordSchema, studentIdSchema, usernameSchema } from "@/lib/schemas/profile";
import Artwork from "@/models/artwork";
import Bookmark from "@/models/bookmark";
import Comment from "@/models/comment";
import Follow from "@/models/follow";
import Like from "@/models/like";
import User from "@/models/user";

const updateProfileSchema = z
  .object({
    username: usernameSchema.optional(),
    fullName: fullNameSchema.optional(),
    studentId: studentIdSchema.optional(),
    password: passwordSchema.optional(),
    mutedTags: z.array(z.string().max(500)).max(1000).optional(),
    showNSFW: z.boolean().optional(),
    grade: z.number().int().min(0).max(999).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "更新するフィールドを指定してください。",
  });

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
      return NextResponse.json({ error: "ユーザーが見つかりません。" }, { status: 404 });
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
        const [signedUrl] = await bucket.file(user.profileImage.path).getSignedUrl(options);
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
    return NextResponse.json({ error: "サーバーエラーです。" }, { status: 500 });
  }
}

/**
 * ログイン中のユーザー情報を更新するAPI
 */
export async function PATCH(req: Request) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (body == null) {
      return NextResponse.json({ error: "リクエストの形式が正しくありません。" }, { status: 400 });
    }

    const result = updateProfileSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }
    const data = result.data;

    await dbConnect();

    const updateData: {
      username?: string;
      fullName?: string;
      studentId?: string;
      hashedPassword?: string;
      mutedTags?: string[];
      showNSFW?: boolean;
      grade?: number;
    } = {};

    if (data.username !== undefined) updateData.username = data.username;

    if (data.fullName !== undefined) updateData.fullName = data.fullName;
    if (data.studentId !== undefined) updateData.studentId = data.studentId;
    if (data.password !== undefined) {
      updateData.hashedPassword = await bcrypt.hash(data.password, 10);
    }
    if (data.mutedTags !== undefined) updateData.mutedTags = data.mutedTags;
    if (data.showNSFW !== undefined) updateData.showNSFW = data.showNSFW;
    if (data.grade !== undefined) updateData.grade = data.grade;

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    });
    if (!updatedUser) {
      return NextResponse.json({ error: "ユーザーが見つかりません。" }, { status: 404 });
    }

    return NextResponse.json({
      id: updatedUser._id,
      username: updatedUser.username,
      fullName: updatedUser.fullName,
      studentId: updatedUser.studentId,
      mutedTags: updatedUser.mutedTags,
      showNSFW: updatedUser.showNSFW,
      grade: updatedUser.grade,
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      const field = Object.keys(error.keyPattern)[0];
      const messages: Record<string, string> = {
        username: "このユーザー名は既に使用されています。",
        studentId: "この学籍番号は既に使用されています。",
      };
      return NextResponse.json({ error: messages[field] ?? "重複エラーです。" }, { status: 409 });
    }
    console.error("An unexpected error occurred:", error);
    return NextResponse.json({ error: "サーバーで予期せぬエラーが発生しました。" }, { status: 500 });
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
      artwork.images.map((image: { path: string }) => bucket.file(image.path).delete()),
    );
    await Promise.all(deletePromises);

    // 投稿関連データの削除
    if (artworkIds.length > 0) {
      await Like.deleteMany({ artworkId: { $in: artworkIds } }).session(session);
      await Bookmark.deleteMany({ artworkId: { $in: artworkIds } }).session(session);
      // 投稿に紐づくコメントも削除
      await Comment.deleteMany({ artworkId: { $in: artworkIds } }).session(session);
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
    return NextResponse.json({ error: "アカウントの削除中にエラーが発生しました。" }, { status: 500 });
  } finally {
    session.endSession();
  }
}
