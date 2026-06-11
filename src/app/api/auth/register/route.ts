import bcrypt from "bcryptjs";
import { serialize } from "cookie";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/dbConnect";
import { isDuplicateKeyError } from "@/lib/dbError";
import { env } from "@/lib/env";
import {
  fullNameSchema,
  passwordSchema,
  studentIdSchema,
  usernameSchema,
} from "@/lib/schemas/profile";
import User from "@/models/user";

const registerSchema = z.object({
  username: usernameSchema,
  fullName: fullNameSchema,
  studentId: studentIdSchema,
  password: passwordSchema,
  sharedPassword: z.string().min(1, "共有パスワードを入力してください。"),
});

/**
 * ユーザーの新規登録を行うAPI
 * @param {Request} req - クライアントからのリクエスト
 * @returns {NextResponse} 成功時はユーザー情報とトークン、失敗時はエラーメッセージを返す
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (body === null) {
    return NextResponse.json(
      { error: "リクエストの形式が正しくありません。" },
      { status: 400 },
    );
  }
  const result = registerSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 },
    );
  }
  const { username, fullName, studentId, password, sharedPassword } =
    result.data;
  if (sharedPassword !== env.SHARED_PASSWORD) {
    return NextResponse.json(
      { error: "共有パスワードが正しくありません。" },
      { status: 403 },
    );
  }
  try {
    await dbConnect();
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      fullName,
      studentId,
      hashedPassword,
    });

    const token = jwt.sign({ id: newUser._id.toString() }, env.JWT_SECRET);

    const cookie = serialize("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 1週間
      path: "/",
    });

    return new NextResponse(
      JSON.stringify({
        message: "ユーザー登録が成功しました。",
        user: { id: newUser._id.toString(), username: newUser.username },
      }),
      {
        status: 201,
        headers: { "Set-Cookie": cookie },
      },
    );
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      const field = Object.keys(error.keyPattern)[0];
      const messages: Record<string, string> = {
        username: "このユーザー名は既に使用されています。",
        studentId: "この学籍番号は既に使用されています。",
      };
      return NextResponse.json(
        { error: messages[field] ?? "重複エラーです。" },
        { status: 409 },
      );
    }
    console.error("An unexpected error occurred:", error);
    return NextResponse.json(
      { error: "サーバーで予期せぬエラーが発生しました。" },
      { status: 500 },
    );
  }
}
