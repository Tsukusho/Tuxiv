import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Bookmark from '@/models/bookmark';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

// ★★★ 引数の型定義を修正 ★★★
type RouteContext = {
  params: {
    id: string;
  }
}

/**
 * ユーザーが特定の作品をブックマーク済みか確認するAPI
 */
export async function GET(req: Request, context: RouteContext) {
  try {
    const JWT_SECRET = process.env.JWT_SECRET!;
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ isBookmarked: false });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const userId = decoded.id;
    const artworkId = context.params.id; // ★ params.id を context.params.id に変更

    await dbConnect();
    const existingBookmark = await Bookmark.findOne({ userId, artworkId });
    return NextResponse.json({ isBookmarked: !!existingBookmark });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ isBookmarked: false });
  }
}

/**
 * 作品をブックマークするAPI
 */
export async function POST(req: Request, context: RouteContext) {
    try {
        const JWT_SECRET = process.env.JWT_SECRET!;
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
    
        if (!token) {
          return NextResponse.json({ error: '認証トークンが必要です。' }, { status: 401 });
        }
    
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
        const userId = decoded.id;
        const artworkId = context.params.id; // ★ params.id を context.params.id に変更
    
        await dbConnect();
    
        const existingBookmark = await Bookmark.findOne({ userId, artworkId });
        if (existingBookmark) {
          return NextResponse.json({ error: '既にブックマーク済みです。' }, { status: 409 });
        }
        
        await Bookmark.create({ userId, artworkId });
    
        return NextResponse.json({ message: 'ブックマークしました。' }, { status: 201 });
    
      } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'サーバーエラーです。' }, { status: 500 });
      }
}

/**
 * 作品のブックマークを解除するAPI
 */
export async function DELETE(req: Request, context: RouteContext) {
    try {
        const JWT_SECRET = process.env.JWT_SECRET!;
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
    
        if (!token) {
          return NextResponse.json({ error: '認証トークンが必要です。' }, { status: 401 });
        }
    
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
        const userId = decoded.id;
        const artworkId = context.params.id; // ★ params.id を context.params.id に変更
    
        await dbConnect();
    
        const result = await Bookmark.deleteOne({ userId, artworkId });
        if (result.deletedCount === 0) {
            return NextResponse.json({ error: 'ブックマークされていません。' }, { status: 404 });
        }
    
        return NextResponse.json({ message: 'ブックマークを解除しました。' });
    
      } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'サーバーエラーです。' }, { status: 500 });
      }
}