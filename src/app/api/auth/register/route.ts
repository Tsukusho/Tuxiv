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

    if (!username || !fullName || !password) {
      return NextResponse.json(
        { error: '必須項目が入力されていません。' },
        { status: 400 }
      );
    }


    if (sharedPassword !== process.env.SHARED_PASSWORD) {
      return NextResponse.json({ error: '共有パスワードが正しくありません。' }, { status: 403 });
    }
    
    const existingUser = await User.findOne({ fullName });
    if (existingUser) {
      return NextResponse.json(
        { error: 'このフルネームは既に使用されています。' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = await User.create({
      username,
      fullName,
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