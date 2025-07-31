import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/user';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';


/**
 * ユーザーのログイン認証を行うAPI
 * @param {Request} req - クライアントからのリクエスト
 * @returns {NextResponse} 成功時はユーザー情報とトークン、失敗時はエラーメッセージを返す
 */
export async function POST(req: Request) {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    console.error('JWT_SECRET is not defined in .env.local');
    return NextResponse.json(
      { error: 'サーバー設定エラーです。' },
      { status: 500 }
    );
  }

  try {
    await dbConnect();

    const { identifier, password, sharedPassword } = await req.json();

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'フルネームとパスワードを入力してください。' },
        { status: 400 }
      );
    }
    
    const user = await User.findOne({
      $or: [{ username: identifier }, { fullName: identifier }],
    });
    if (!user) {
      return NextResponse.json(
        { error: '正しいユーザー名または本名と、パスワードを入力してください。' },
        { status: 401 }
      );
    }

    // 一時的なパスワードリセット用の特別処理
    let isPasswordMatch = false;
    if (user.hashedPassword === "1" && password === "temp123") {
      isPasswordMatch = true; // 一時的にログイン許可
    } else {
      isPasswordMatch = await bcrypt.compare(password, user.hashedPassword);
    }
    
    if (!isPasswordMatch) {
      return NextResponse.json(
        { error: '正しいユーザー名または本名と、パスワードを入力してください。' },
        { status: 401 }
      );
    }
    
    const token = jwt.sign({ id: user._id.toString() }, JWT_SECRET);

    const cookie = serialize('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1週間
      path: '/',
    });

    return new NextResponse(JSON.stringify({
        message: '認証に成功しました。',
        user: { id: user._id.toString(), username: user.username }
    }), {
        status: 200,
        headers: { 'Set-Cookie': cookie }
    });

  } catch (error) {
    console.error('An unexpected error occurred:', error);
    return NextResponse.json(
      { error: 'サーバーで予期せぬエラーが発生しました。' },
      { status: 500 }
    );
  }
}