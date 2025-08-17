import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ScheduleEvent from '@/models/scheduleEvent';
import Availability from '@/models/availability';
import User from '@/models/user'; // 👈 Tuxivの既存Userモデルをインポート
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    // 1. 認証チェック (ログインしているか確認)
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: '認証されていません' }, { status: 401 });
    }
    // トークンを検証し、ユーザーIDを取り出す
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    if (!decoded.id) {
        return NextResponse.json({ message: '無効なトークンです' }, { status: 401 });
    }
    
    await dbConnect();
    const eventId = params.id;

    // 2. ログイン中のユーザー情報をDBから取得 (本名のみ)
    const currentUser = await User.findById(decoded.id).select('fullName').lean();
    if (!currentUser) {
        return NextResponse.json({ message: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // 3. イベント本体の基本情報を取得
    const event = await ScheduleEvent.findById(eventId).lean();
    if (!event) {
      return NextResponse.json({ message: 'イベントが見つかりません' }, { status: 404 });
    }

    // 4. そのイベントに関連する「全員の」出欠情報を取得
    const allAvailabilities = await Availability.find({ eventId: eventId }).lean();
    
    // 5. 全員の出欠情報の中から「ログイン中のユーザー」のデータだけを探す
    const currentUserAvailability = allAvailabilities.find(
      (avail) => avail.userId.toString() === decoded.id
    );
    return NextResponse.json({ 
        event, 
        availabilities: allAvailabilities, // allAvailabilitiesをavailabilitiesに変更
        currentUser,
        currentUserAvailability // 👈 このユーザーの保存済みデータ (なければundefined)
    }, { status: 200 });

  } catch (error) {
    console.error('イベント取得エラー:', error);
    if (error instanceof jwt.JsonWebTokenError) {
        return NextResponse.json({ message: '認証トークンが無効です' }, { status: 401 });
    }
    return NextResponse.json({ message: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}
