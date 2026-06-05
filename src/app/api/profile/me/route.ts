// /src/app/api/profile/me/route.ts

import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth";
import dbConnect from "@/lib/dbConnect";
import { bucket } from "@/lib/gcs";
import Artwork from "@/models/artwork";
import Follow from "@/models/follow";
import User, { type IUserData } from "@/models/user";

export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
    }

    await dbConnect();

    // 1. まずユーザー情報を取得してNSFW設定とミュートタグを確認
    const user = await User.findById(userId).select("username showNSFW mutedTags").lean<IUserData>();

    if (!user) {
      return NextResponse.json({ error: "ユーザーが見つかりません。" }, { status: 404 });
    }

    // 2. NSFW設定とミュートタグを基に、作品検索のクエリを作成
    const artworkQuery: Record<string, unknown> = {
      userId,
      tags: { $nin: user.mutedTags || [] },
    };
    if (user.showNSFW !== true) {
      artworkQuery.isNSFW = false;
    }

    // 3. フォロワー数と作品一覧を並行して取得
    const [followerCount, artworks] = await Promise.all([
      Follow.countDocuments({ followingId: userId }),
      Artwork.find(artworkQuery).sort({ createdAt: -1 }).lean(),
    ]);

    // 削除済みユーザーの投稿を除外（通常は発生しないが安全のため）
    const validArtworks = artworks.filter((artwork) => artwork.userId);

    // 投稿一覧に署名付きURLを追加
    const artworksWithSignedUrls = await Promise.all(
      validArtworks.map(async (artwork) => {
        if (artwork.images && artwork.images.length > 0) {
          const [signedUrl] = await bucket.file(artwork.images[0].path).getSignedUrl({
            version: "v4",
            action: "read",
            expires: Date.now() + 15 * 60 * 1000,
          });
          // NOTE: .lean()を使っているので、直接プロパティを追加できる
          (artwork as typeof artwork & { thumbnailUrl: string }).thumbnailUrl = signedUrl;
        }
        return artwork;
      }),
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
    return NextResponse.json({ error: "サーバーエラーです。" }, { status: 500 });
  }
}
