import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Artwork from '@/models/artwork';
import { getAuthenticatedUserId } from '@/lib/auth';

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await context.params;

    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: '認証が必要です。' }, { status: 401 });
    }

    const body = await req.json();
    const tags: unknown = body?.tags;
    if (!Array.isArray(tags) || tags.length === 0 || !tags.every(t => typeof t === 'string')) {
      return NextResponse.json({ error: 'tagsは非空の文字列配列で指定してください。' }, { status: 400 });
    }

    const artwork = await Artwork.findById(id);
    if (!artwork) {
      return NextResponse.json({ error: '作品が見つかりません。' }, { status: 404 });
    }
    if (artwork.userId.toString() !== userId) {
      return NextResponse.json({ error: '編集権限がありません。' }, { status: 403 });
    }

    artwork.tags = (tags as string[]).map(t => t.trim()).filter(Boolean);
    await artwork.save();
    return NextResponse.json(artwork, { status: 200 });
  } catch (error) {
    console.error('タグ更新エラー:', error);
    return NextResponse.json({ error: 'サーバーエラーです。' }, { status: 500 });
  }
}


