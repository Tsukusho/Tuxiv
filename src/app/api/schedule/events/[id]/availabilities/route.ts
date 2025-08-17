import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Availability from '@/models/availability';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    // 認証チェック
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: '認証されていません' }, { status: 401 });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };

    await dbConnect();
    const eventId = params.id;

    // リクエストボディからデータを取得
    const { name, grade, roles, availableSlots } = await request.json();

    // 🔍 デバッグログを追加
    console.log('=== Availability API Debug ===');
    console.log('受信したavailableSlots:', JSON.stringify(availableSlots, null, 2));
    
    // availableSlotsの各スロットにtypeフィールドが存在することを確認
    const slotsWithType = availableSlots.map((slot: { start: string; end: string; type?: string }) => ({
      start: slot.start,
      end: slot.end,
      type: slot.type || 'available' // 明示的にデフォルト値を設定
    }));
    
    console.log('保存用に処理したavailableSlots:', JSON.stringify(slotsWithType, null, 2));

    // "Upsert"処理: データがあれば更新、なければ新規作成
    const updatedAvailability = await Availability.findOneAndUpdate(
      { 
        eventId: eventId,
        userId: decoded.id 
      },
      { 
        name, 
        grade, 
        roles, 
        availableSlots: slotsWithType // 処理後のデータを使用
      },
      { 
        new: true, // trueにすると、更新後のドキュメントを返す
        upsert: true // trueにすると、データが見つからない場合に新規作成する
      }
    );

    console.log('保存後のavailableSlots:', JSON.stringify(updatedAvailability.availableSlots, null, 2));
    console.log('=== Debug終了 ===');

    return NextResponse.json(updatedAvailability, { status: 200 });

  } catch (error) {
    console.error('出欠情報保存エラー:', error);
    if (error instanceof jwt.JsonWebTokenError) {
        return NextResponse.json({ message: '認証トークンが無効です' }, { status: 401 });
    }
    return NextResponse.json({ message: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}