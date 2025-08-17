import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ScheduleEvent from '@/models/scheduleEvent';
import User from '@/models/user'; // Tuxivの既存Userモデル
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    // 1. 認証チェック (Tuxivの既存の仕組みを流用)
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: '認証されていません' }, { status: 401 });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    if (!decoded.id) {
        return NextResponse.json({ message: '無効なトークンです' }, { status: 401 });
    }
    
    // 2. データベース接続
    await dbConnect();

    // 3. リクエストボディからデータを取得
    const { title, description, candidateDates } = await request.json();

    // 簡単なバリデーション
    if (!title || !candidateDates || candidateDates.length === 0) {
      return NextResponse.json({ message: 'タイトルと候補日は必須です' }, { status: 400 });
    }

    // 4. 新しいイベントを作成して保存
    const newEvent = new ScheduleEvent({
      title,
      description,
      candidateDates,
      createdBy: decoded.id, // ログイン中のユーザーIDを関連付け
    });

    await newEvent.save();

    return NextResponse.json(newEvent, { status: 201 });

  } catch (error) {
    console.error('イベント作成エラー:', error);
    if (error instanceof jwt.JsonWebTokenError) {
        return NextResponse.json({ message: '認証トークンが無効です' }, { status: 401 });
    }
    return NextResponse.json({ message: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}