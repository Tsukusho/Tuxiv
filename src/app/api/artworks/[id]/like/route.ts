// /app/api/artworks/[id]/like/route.ts

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Artwork from '@/models/artwork';
import Like from '@/models/like';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

/**
 * ユーザーが特定の作品をいいね済みか確認するAPI
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const JWT_SECRET = process.env.JWT_SECRET!;
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ isLiked: false });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const userId = decoded.id;
    const { id: artworkId } = await params;

    await dbConnect();
    const existingLike = await Like.findOne({ userId, artworkId });
    return NextResponse.json({ isLiked: !!existingLike });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ isLiked: false });
  }
}

/**
 * 作品にいいねするAPI
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const JWT_SECRET = process.env.JWT_SECRET!;
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: '認証トークンが必要です。' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const userId = decoded.id;
    const { id: artworkId } = await params;

    await dbConnect();
    const existingLike = await Like.findOne({ userId, artworkId });
    if (existingLike) {
      return NextResponse.json({ error: '既にいいね済みです。' }, { status: 409 });
    }
    
    await Like.create({ userId, artworkId });
    await Artwork.updateOne({ _id: artworkId }, { $inc: { likeCount: 1 } });

    return NextResponse.json({ message: 'いいねしました。' }, { status: 201 });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'サーバーエラーです。' }, { status: 500 });
  }
}

/**
 * 作品のいいねを解除するAPI
 */
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const JWT_SECRET = process.env.JWT_SECRET!;
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
    
        if (!token) {
          return NextResponse.json({ error: '認証トークンが必要です。' }, { status: 401 });
        }
    
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
        const userId = decoded.id;
        const artworkId = params.id;
    
        await dbConnect();
    
        const result = await Like.deleteOne({ userId, artworkId });
        if (result.deletedCount === 0) {
            return NextResponse.json({ error: 'いいねされていません。' }, { status: 404 });
        }

        await Artwork.updateOne({ _id: artworkId }, { $inc: { likeCount: -1 } });
    
        return NextResponse.json({ message: 'いいねを解除しました。' });
    
      } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'サーバーエラーです。' }, { status: 500 });
      }
}