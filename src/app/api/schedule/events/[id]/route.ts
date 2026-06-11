import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ScheduleEvent from '@/models/scheduleEvent';
import Availability from '@/models/availability';
import User from '@/models/user'; // Tuxivの既存Userモデルをインポート
import { getAuthenticatedUserId } from '@/lib/auth';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    // 1. 認証チェック (ログインしているか確認)
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: '認証が必要です。' }, { status: 401 });
    }

    await dbConnect();
    const eventId = params.id;

    // 2. ログイン中のユーザー情報をDBから取得 (本名のみ)
    const currentUser = await User.findById(userId).select('fullName grade').lean();
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

    // grade は User.grade を正とする (Phase A: Availability.grade ではなく User から注入)
    const gradeUsers = await User.find({ _id: { $in: allAvailabilities.map((a) => a.userId) } })
      .select('grade')
      .lean();
    const gradeByUser = new Map(gradeUsers.map((u) => [String(u._id), u.grade]));
    const availabilities = allAvailabilities.map((a) => ({
      ...a,
      grade: gradeByUser.get(a.userId.toString())?.toString() ?? a.grade,
    }));

    // 5. 全員の出欠情報の中から「ログイン中のユーザー」のデータだけを探す
    const currentUserAvailability = availabilities.find(
      (avail) => avail.userId.toString() === userId
    );
    return NextResponse.json({
        event,
        availabilities,
        currentUser,
        currentUserAvailability // このユーザーの保存済みデータ (なければundefined)
    }, { status: 200 });

  } catch (error) {
    console.error('イベント取得エラー:', error);
    return NextResponse.json({ message: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}
