import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ScheduleEvent from '@/models/scheduleEvent';
import User from '@/models/user'; // Tuxivの既存Userモデル
import { getAuthenticatedUserId } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    // 1. 認証チェック
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: '認証が必要です。' }, { status: 401 });
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
      createdBy: userId, // ログイン中のユーザーIDを関連付け
    });

    await newEvent.save();

    return NextResponse.json(newEvent, { status: 201 });

  } catch (error) {
    console.error('イベント作成エラー:', error);
    return NextResponse.json({ message: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}