// /app/api/artworks/[id]/like/route.ts

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Artwork from '@/models/artwork';
import Like from '@/models/like';
import { getAuthenticatedUserId } from '@/lib/auth';

/**
 * ユーザーが特定の作品をいいね済みか確認するAPI
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ isLiked: false });
    }

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
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: '認証が必要です。' }, { status: 401 });
    }

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
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
    try {
        const userId = await getAuthenticatedUserId();
        if (!userId) {
          return NextResponse.json({ error: '認証が必要です。' }, { status: 401 });
        }

        const { id } = await context.params;
        const artworkId = id;

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