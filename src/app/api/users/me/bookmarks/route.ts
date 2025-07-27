// /src/app/api/users/me/bookmarks/route.ts

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Bookmark from '@/models/bookmark';
import User from '@/models/user';
import Artwork from '@/models/artwork'; // Artworkモデルも必要
import jwt from 'jsonwebtoken';
import { bucket } from '@/lib/gcs';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
  try {
    const JWT_SECRET = process.env.JWT_SECRET!;
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: '認証トークンが必要です。' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const userId = decoded.id;

    await dbConnect();

    const bookmarks = await Bookmark.find({ userId })
      .sort({ createdAt: -1 })
      .populate({
        path: 'artworkId',
        model: Artwork,
        populate: { // artworkの作者情報も取得
            path: 'userId',
            model: User,
            select: 'username'
        }
      });
      
    // populateしたartworkIdから作品情報だけを取り出す
    const artworks = bookmarks.map(b => b.artworkId);

    // 署名付きURLを生成
    const artworksWithSignedUrls = await Promise.all(
        artworks.map(async (artwork: any) => {
            const artworkObject = JSON.parse(JSON.stringify(artwork));
            if (artwork.images && artwork.images.length > 0) {
                const [signedUrl] = await bucket.file(artwork.images[0].path).getSignedUrl({
                    version: 'v4', action: 'read', expires: Date.now() + 15 * 60 * 1000,
                });
                artworkObject.thumbnailUrl = signedUrl;
            }
            return artworkObject;
        })
    );

    return NextResponse.json({ artworks: artworksWithSignedUrls });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'サーバーエラーです。' }, { status: 500 });
  }
}