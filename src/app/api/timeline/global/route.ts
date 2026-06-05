// /src/app/api/timeline/global/route.ts

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Artwork, { IArtwork } from '@/models/artwork';
import User from '@/models/user';
import { bucket } from '@/lib/gcs';
import { getAuthenticatedUserId } from '@/lib/auth';
import { FilterQuery } from 'mongoose';

export async function GET(req: Request) {
  try {
    await dbConnect();
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: '認証が必要です。' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = 1000; //todo:ページネーション実装したい

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません。' }, { status: 404 });
    }
    const mutedTags = user.mutedTags || [];

    const query: FilterQuery<IArtwork> = {
      tags: { $nin: mutedTags },
    };

    if (user.showNSFW !== true) {
      query.isNSFW = false;
    }

    const artworks = await Artwork.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({
        path: 'userId',
        select: 'username profileImage',
        model: User,
      });

    // 削除済みユーザーの投稿を除外
    const validArtworks = artworks.filter(artwork => artwork.userId !== null);

    const totalArtworks = await Artwork.countDocuments({});

    const artworksWithSignedUrls = await Promise.all(
      validArtworks.map(async (artwork) => {
            const artworkObject = JSON.parse(JSON.stringify(artwork));

            // 匿名投稿の場合はユーザー情報を削除
            if (artwork.isAnonymous) {
                delete artworkObject.userId;
            }

            if (artwork.images && artwork.images.length > 0) {
                const [signedUrl] = await bucket.file(artwork.images[0].path).getSignedUrl({
                    version: 'v4', action: 'read', expires: Date.now() + 15 * 60 * 1000,
                });
                artworkObject.thumbnailUrl = signedUrl;
            }

            // プロフィール画像のSigned URLを生成（匿名でない場合のみ）
            if (!artwork.isAnonymous && artworkObject.userId && artworkObject.userId.profileImage?.path) {
              try {
                const [profileSignedUrl] = await bucket.file(artworkObject.userId.profileImage.path).getSignedUrl({
                  version: 'v4', action: 'read', expires: Date.now() + 15 * 60 * 1000,
                });
                artworkObject.userId.profileImageUrl = profileSignedUrl;
              } catch (error) {
                console.warn('プロフィール画像のSigned URL生成に失敗:', error);
              }
            }

            return artworkObject;
        })
    );

    return NextResponse.json({
      artworks: artworksWithSignedUrls,
      totalPages: Math.ceil(totalArtworks / limit),
      currentPage: page,
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'サーバーエラーです。' }, { status: 500 });
  }
}