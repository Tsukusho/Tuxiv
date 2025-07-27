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

export async function GET() {
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

    // 1. まずユーザー情報を取得してNSFW設定を確認
    const user = await User.findById(userId).select('username showNSFW').lean<IUserData>();

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません。' }, { status: 404 });
    }

    // 2. NSFW設定を基に、作品検索のクエリを作成
    const artworkQuery: Record<string, unknown> = { userId };
    if (!user.showNSFW) {
      artworkQuery.isNSFW = false;
    }
    
    // 3. フォロワー数と作品一覧を並行して取得
    const [followerCount, artworks] = await Promise.all([
      Follow.countDocuments({ followingId: userId }),
      Artwork.find(artworkQuery).sort({ createdAt: -1 }).lean() 
    ]);

    // 投稿一覧に署名付きURLを追加
    const artworksWithSignedUrls = await Promise.all(
        artworks.map(async (artwork) => {
            if (artwork.images && artwork.images.length > 0) {
                const [signedUrl] = await bucket.file(artwork.images[0].path).getSignedUrl({
                    version: 'v4', action: 'read', expires: Date.now() + 15 * 60 * 1000,
                });
                // NOTE: .lean()を使っているので、直接プロパティを追加できる
                (artwork as typeof artwork & { thumbnailUrl: string }).thumbnailUrl = signedUrl;
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