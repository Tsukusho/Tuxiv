import type { FilterQuery } from "mongoose";
import { getAuthenticatedUserId } from "@/lib/auth";
import dbConnect from "@/lib/dbConnect";
import { getReadSignedUrl } from "@/lib/gcs";
import Artwork, { type IArtwork } from "@/models/artwork";
import User from "@/models/user";

export type ViewerContext = {
  userId: string;
  mutedTags: string[];
  showNSFW: boolean;
};

export async function getViewerContext(): Promise<ViewerContext | null> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return null;

  await dbConnect();
  const user = await User.findById(userId)
    .select("mutedTags showNSFW")
    .lean<{ mutedTags?: string[]; showNSFW?: boolean }>();
  if (!user) return null;

  return {
    userId,
    mutedTags: user.mutedTags ?? [],
    showNSFW: user.showNSFW ?? false,
  };
}

export type ArtworkItem = {
  id: string;
  imageUrl: string | null;
  title: string;
  tags: string[];
  isNSFW: boolean;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  author: { username: string; profileImageUrl: string | null } | null;
};

// cursor ページ。global / user-profile の両 API が返す共通形。
export type ArtworkPage = {
  artworks: ArtworkItem[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type ArtworkSource = {
  _id: unknown;
  images: { path: string }[];
  title: string;
  tags: string[];
  isNSFW: boolean;
  isAnonymous: boolean;
  likeCount: number;
  commentCount: number;
  createdAt: Date;
  userId: { username: string; profileImage?: { path: string } };
};

// 全作品フィードの1ページ取得 (global / user-profile が共有)。
// filter で対象を絞る (例: { userId } でその人だけ)。viewer の muted/NSFW と cursor は常に適用。
export async function fetchArtworkPage(
  viewer: ViewerContext,
  opts: { cursor?: string | null; limit?: number; filter?: FilterQuery<IArtwork> } = {},
): Promise<ArtworkPage> {
  const { cursor, limit = 20, filter = {} } = opts;
  await dbConnect();

  const query: FilterQuery<IArtwork> = {
    ...filter,
    ...(viewer.mutedTags.length > 0 && { tags: { $nin: viewer.mutedTags } }),
    ...(!viewer.showNSFW && { isNSFW: false }),
    ...(cursor && { createdAt: { $lt: new Date(cursor) } }),
  };

  const data = await Artwork.find(query)
    .sort({ createdAt: -1 })
    .limit(limit + 1) // hasMore 判定のため1件多く取る
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
    .lean<ArtworkSource[]>();

  const hasMore = data.length > limit;
  const items = hasMore ? data.slice(0, limit) : data;
  const artworks = await toArtworkItems(items);

  return {
    artworks,
    nextCursor: hasMore ? items[items.length - 1].createdAt.toISOString() : null,
    hasMore,
  };
}

export async function toArtworkItems(artworks: ArtworkSource[]): Promise<ArtworkItem[]> {
  return Promise.all(
    artworks.map(async (artwork) => {
      const thumbnailKey = artwork.images[0]?.path;
      const avatarKey = artwork.isAnonymous ? undefined : artwork.userId.profileImage?.path;

      const [imageUrl, profileImageUrl] = await Promise.all([
        thumbnailKey ? getReadSignedUrl(thumbnailKey) : null,
        avatarKey ? getReadSignedUrl(avatarKey) : null,
      ]);

      return {
        id: String(artwork._id),
        imageUrl,
        title: artwork.title,
        tags: artwork.tags,
        isNSFW: artwork.isNSFW,
        likeCount: artwork.likeCount,
        commentCount: artwork.commentCount,
        createdAt: artwork.createdAt.toISOString(),
        author: artwork.isAnonymous ? null : { username: artwork.userId.username, profileImageUrl },
      };
    }),
  );
}
