import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Artwork from '@/models/artwork';
import User from '@/models/user';
import { bucket } from '@/lib/gcs';

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

    // NOTE: { tags: { $all: ... } } を使うことで、指定された全てのタグを含む作品を検索(AND検索)
    const query = { tags: { $all: tagsArray } };

    const artworks = await Artwork.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({
        path: 'userId',
        select: 'username',
        model: User,
      });
      
    const totalArtworks = await Artwork.countDocuments(query);

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