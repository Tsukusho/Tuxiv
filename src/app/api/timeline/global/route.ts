// /src/app/api/timeline/global/route.ts

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Artwork, { IArtwork } from '@/models/artwork';
import User from '@/models/user';
import { bucket } from '@/lib/gcs';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { FilterQuery } from 'mongoose';

export async function GET(req: Request) {
  try {
    await dbConnect();
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: '認証トークンが必要です。' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = 1000; //todo:ページネーション実装したい

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    const userId = decoded.id;

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません。' }, { status: 404 });
    }
    const mutedTags = user.mutedTags || [];

    const query: FilterQuery<IArtwork> = {
      tags: { $nin: mutedTags },
    };

    if (!user.showNSFW) {
      query.isNSFW = false;
    }

    const artworks = await Artwork.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({
        path: 'userId',
        select: 'username',
        model: User,
      });
      
    const totalArtworks = await Artwork.countDocuments({});

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