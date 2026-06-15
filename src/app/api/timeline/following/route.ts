// /src/app/api/timeline/following/route.ts
// フォロー中ユーザーの作品をユーザー単位でグループ化して返す TL。匿名投稿は除外。

import type { FilterQuery, Types } from "mongoose";
import { NextResponse } from "next/server";
import { type ArtworkSource, getViewerContext, toArtworkItems } from "@/app/api/timeline/_artworks";
import Artwork, { type IArtwork } from "@/models/artwork";
import Follow from "@/models/follow";
import User from "@/models/user";

// グループ化に userId._id が要るので、populate で取れる _id を足した形。
type FollowingArtwork = Omit<ArtworkSource, "userId"> & {
  userId: ArtworkSource["userId"] & { _id: Types.ObjectId };
};

const PER_USER_LIMIT = 100;

export async function GET() {
  try {
    const viewer = await getViewerContext();
    if (!viewer) {
      return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
    }

    const follows = await Follow.find({ followerId: viewer.userId })
      .select("followingId")
      .lean<{ followingId: Types.ObjectId }[]>();
    const followingIds = follows.map((follow) => follow.followingId);

    if (followingIds.length === 0) {
      return NextResponse.json({ userArtworks: [] });
    }

    const query: FilterQuery<IArtwork> = {
      userId: { $in: followingIds },
      isAnonymous: false, // フォロー TL は匿名投稿を除外
      ...(viewer.mutedTags.length > 0 && { tags: { $nin: viewer.mutedTags } }),
      ...(!viewer.showNSFW && { isNSFW: false }),
    };

    const data = await Artwork.find(query)
      .sort({ createdAt: -1 })
      .select({
        images: { $slice: 1 },
        title: 1,
        tags: 1,
        isNSFW: 1,
        isAnonymous: 1,
        likeCount: 1,
        commentCount: 1,
        createdAt: 1,
        userId: 1,
      })
      .populate({ path: "userId", select: "username profileImage", model: User })
      .lean<FollowingArtwork[]>();

    const groups = new Map<string, { username: string; items: FollowingArtwork[] }>();
    for (const artwork of data) {
      const key = String(artwork.userId._id);
      const group = groups.get(key) ?? { username: artwork.userId.username, items: [] };
      if (group.items.length < PER_USER_LIMIT) group.items.push(artwork);
      groups.set(key, group);
    }

    const userArtworks = await Promise.all(
      [...groups.entries()].map(async ([id, group]) => ({
        user: { _id: id, username: group.username },
        artworks: await toArtworkItems(group.items),
      })),
    );

    return NextResponse.json({ userArtworks });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "サーバーエラーです。" }, { status: 500 });
  }
}
