// /src/app/api/timeline/following/route.ts

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Artwork from '@/models/artwork';
import Follow from '@/models/follow';
import User from '@/models/user';
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
    
    const currentUser = await User.findById(userId);
    if (!currentUser) {
        return NextResponse.json({ error: 'ユーザーが見つかりません。' }, { status: 404 });
    }
    const mutedTags = currentUser.mutedTags || [];

    const following = await Follow.find({ followerId: userId }).select('followingId');
    const followingIds = following.map(f => f.followingId);
    followingIds.push(userId as any);

    const userArtworksPromises = followingIds.map(async (followingId) => {
        const user = await User.findById(followingId).select('username');
        if (!user) return null;

        const artworks = await Artwork.find({
            userId: followingId,
            tags: { $nin: mutedTags },
            isAnonymous: false,
        })
        .sort({ createdAt: -1 })
        .limit(100); // 各ユーザーごとに最新10件を取得 全件は一旦しない

        if (artworks.length === 0) return null;

        // 署名付きURLを生成
        const artworksWithSignedUrls = await Promise.all(
            artworks.map(async (artwork) => {
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
        
        return { user, artworks: artworksWithSignedUrls };
    });

    // 全てのユーザーの作品取得処理が完了するのを待つ
    const userArtworksGroups = (await Promise.all(userArtworksPromises)).filter(Boolean);

    return NextResponse.json({ userArtworks: userArtworksGroups });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'サーバーエラーです。' }, { status: 500 });
  }
}