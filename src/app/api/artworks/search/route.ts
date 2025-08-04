import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Artwork from '@/models/artwork';
import User from '@/models/user';
import { bucket } from '@/lib/gcs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    const tagsQuery = searchParams.get('tags');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = 30;

    if (!tagsQuery) {
      return NextResponse.json({ error: 'タグが指定されていません。' }, { status: 400 });
    }

    // カンマ区切りのタグを配列に変換
    const tagsArray = tagsQuery.split(',').map(tag => tag.trim());

    // ユーザー設定を取得
    let mutedTags: string[] = [];
    let showNSFW = false;
    
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
        const user = await User.findById(decoded.id).select('mutedTags showNSFW');
        if (user) {
          mutedTags = user.mutedTags || [];
          showNSFW = user.showNSFW || false;
        }
      } catch (e) {
        console.log("Invalid token, proceeding as guest.");
      }
    }

    // 検索クエリにフィルタを適用
    const query: Record<string, unknown> = { 
      tags: { $all: tagsArray, $nin: mutedTags }
    };
    
    if (!showNSFW) {
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

    // 削除済みユーザーの投稿を除外
    const validArtworks = artworks.filter(artwork => artwork.userId !== null);
      
    const totalArtworks = await Artwork.countDocuments(query);

    // 署名付きURLを生成し、匿名投稿の処理を行う
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