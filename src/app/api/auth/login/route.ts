import bcrypt from "bcryptjs";
import { serialize } from "cookie";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/dbConnect";
import { env } from "@/lib/env";
import User from "@/models/user";

const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, "正しいユーザー名または本名または学籍番号を入力してください。")
    .max(200, "入力が長すぎます"),
  password: z
    .string()
    .min(1, "パスワードを入力してください。")
    .max(200, "入力が長すぎます"),
});

/**
 * ユーザーのログイン認証を行うAPI
 * @param {Request} req - クライアントからのリクエスト
 * @returns {NextResponse} 成功時はユーザー情報とトークン、失敗時はエラーメッセージを返す
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    if (body == null) {
      return NextResponse.json(
        { error: "リクエストの形式が正しくありません。" },
        { status: 400 },
      );
    }

    const result = loginSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 },
      );
    }
    const { identifier, password } = result.data;
    await dbConnect();
    const user = await User.findOne({
      $or: [
        { username: identifier },
        { fullName: identifier },
        { studentId: identifier },
      ],
    });
    if (!user) {
      return NextResponse.json(
        {
          error:
            "正しいユーザー名または本名または学籍番号と、パスワードを入力してください。",
        },
        { status: 401 },
      );
    }

    const isPasswordMatch = await bcrypt.compare(password, user.hashedPassword);

    if (!isPasswordMatch) {
      return NextResponse.json(
        {
          error:
            "正しいユーザー名または本名または学籍番号と、パスワードを入力してください。",
        },
        { status: 401 },
      );
    }

    const token = jwt.sign({ id: user._id.toString() }, env.JWT_SECRET);

    const cookie = serialize("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 1週間
      path: "/",
    });

    return new NextResponse(
      JSON.stringify({
        message: "認証に成功しました。",
        user: { id: user._id.toString(), username: user.username },
      }),
      {
        status: 200,
        headers: { "Set-Cookie": cookie },
      },
    );
  } catch (error) {
    console.error("An unexpected error occurred:", error);
    return NextResponse.json(
      { error: "サーバーで予期せぬエラーが発生しました。" },
      { status: 500 },
    );
  }
}
