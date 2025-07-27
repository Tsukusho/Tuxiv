import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/user';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';


/**
 * ユーザーの新規登録を行うAPI
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

    const { username, fullName, password, sharedPassword } = await req.json();

    // 必須項目のチェック
    if (!username || !fullName || !password) {
      return NextResponse.json(
        { error: 'ユーザー名、本名、パスワードは全て必須です。' },
        { status: 400 }
      );
    }

    // 入力値の基本バリデーション
    if (username.trim().length < 2) {
      return NextResponse.json(
        { error: 'ユーザー名は2文字以上で入力してください。' },
        { status: 400 }
      );
    }

    if (fullName.trim().length < 2) {
      return NextResponse.json(
        { error: '本名は2文字以上で入力してください。' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'パスワードは6文字以上で入力してください。' },
        { status: 400 }
      );
    }

    // 共有パスワードのチェック
    if (sharedPassword !== process.env.SHARED_PASSWORD) {
      return NextResponse.json({ error: '共有パスワードが正しくありません。' }, { status: 403 });
    }
    
    // ユーザー名の重複チェック
    const existingUsername = await User.findOne({ username: username.trim() });
    if (existingUsername) {
      return NextResponse.json(
        { error: 'このユーザー名は既に使用されています。' },
        { status: 409 }
      );
    }

    // 本名の重複チェック
    const existingFullName = await User.findOne({ fullName: fullName.trim() });
    if (existingFullName) {
      return NextResponse.json(
        { error: 'この本名は既に使用されています。' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = await User.create({
      username: username.trim(),
      fullName: fullName.trim(),
      hashedPassword,
    });
    
    const token = jwt.sign({ id: newUser._id.toString() }, JWT_SECRET);
    
    const cookie = serialize('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      maxAge: 60 * 60 * 24 * 7, // 1週間
      path: '/',
    });
    
    return new NextResponse(JSON.stringify({
      message: 'ユーザー登録が成功しました。',
      user: { id: newUser._id.toString(), username: newUser.username }
    }), {
      status: 201,
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