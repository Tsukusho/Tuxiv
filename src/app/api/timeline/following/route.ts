// /src/app/api/timeline/following/route.ts

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Artwork, { IArtwork } from '@/models/artwork';
import Follow from '@/models/follow';
import User from '@/models/user';
import { bucket } from '@/lib/gcs';
import { getAuthenticatedUserId } from '@/lib/auth';
import { FilterQuery } from 'mongoose';

export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: '認証が必要です。' }, { status: 401 });
    }

    await dbConnect();

    const currentUser = await User.findById(userId);
    if (!currentUser) {
        return NextResponse.json({ error: 'ユーザーが見つかりません。' }, { status: 404 });
    }
    const mutedTags = currentUser.mutedTags || [];

    const following = await Follow.find({ followerId: userId }).select('followingId');
    const followingIds = following.map(f => f.followingId);

    const userArtworksPromises = followingIds.map(async (followingId) => {
        const user = await User.findById(followingId).select('username');
        if (!user) return null;
        const query: FilterQuery<IArtwork> = {
          userId: followingId,
          isAnonymous: false, // 匿名投稿を除外
          tags: { $nin: mutedTags },
        };
        if (currentUser.showNSFW !== true) {
          query.isNSFW = false;
        }

        const artworks = await Artwork.find(query)
        .sort({ createdAt: -1 })
        .limit(100); // 各ユーザーごとに最新100件を取得

        // 削除済みユーザーの投稿を除外（通常following内では発生しないが安全のため）
        const validArtworks = artworks.filter(artwork => artwork.userId);

        if (validArtworks.length === 0) return null;

        // 署名付きURLを生成
        const artworksWithSignedUrls = await Promise.all(
            validArtworks.map(async (artwork) => {
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