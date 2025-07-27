// /src/app/api/profile/me/route.ts

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/user';
import Artwork from '@/models/artwork';
import Follow from '@/models/follow';
import jwt from 'jsonwebtoken';
import { bucket } from '@/lib/gcs';
import { IUserData } from '@/models/user'; 

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

    const [user, followerCount, artworks] = await Promise.all([
      User.findById(userId).select('username').lean<IUserData>(), 
      Follow.countDocuments({ followingId: userId }),
      Artwork.find({ userId }).sort({ createdAt: -1 }).lean() 
    ]);

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません。' }, { status: 404 });
    }

    // 投稿一覧に署名付きURLを追加
    const artworksWithSignedUrls = await Promise.all(
        artworks.map(async (artwork) => {
            if (artwork.images && artwork.images.length > 0) {
                const [signedUrl] = await bucket.file(artwork.images[0].path).getSignedUrl({
                    version: 'v4', action: 'read', expires: Date.now() + 15 * 60 * 1000,
                });
                // NOTE: .lean()を使っているので、直接プロパティを追加できる
                (artwork as any).thumbnailUrl = signedUrl;
            }
            return artwork;
        })
    );

    return NextResponse.json({
      user: {
        username: user.username,
        followerCount,
      },
      artworks: artworksWithSignedUrls,
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'サーバーエラーです。' }, { status: 500 });
  }
}