// /src/app/api/users/me/bookmarks/route.ts

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Bookmark from '@/models/bookmark';
import User from '@/models/user';
import Artwork from '@/models/artwork'; // Artworkモデルも必要
import { bucket } from '@/lib/gcs';
import { getAuthenticatedUserId } from '@/lib/auth';

export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: '認証が必要です。' }, { status: 401 });
    }

    await dbConnect();

    // ユーザー設定を取得
    const user = await User.findById(userId).select('mutedTags showNSFW');
    const mutedTags = user?.mutedTags || [];
    const showNSFW = user?.showNSFW || false;

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

    // フィルタリングを適用
    const filteredArtworks = artworks.filter(artwork => {
      if (!artwork || !artwork.userId) return false; // 削除済みユーザーの投稿を除外

      // ミュートタグチェック
      if (artwork.tags && artwork.tags.some((tag: string) => mutedTags.includes(tag))) {
        return false;
      }

      // NSFW チェック
      if (!showNSFW && artwork.isNSFW) {
        return false;
      }

      return true;
    });

    // 署名付きURLを生成し、匿名投稿の処理を行う
    const artworksWithSignedUrls = await Promise.all(
        filteredArtworks.map(async (artwork) => {
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

    return NextResponse.json({ artworks: artworksWithSignedUrls });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'サーバーエラーです。' }, { status: 500 });
  }
}