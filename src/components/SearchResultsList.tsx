import { IArtworkData } from '@/models/artwork';
import { bucket } from '@/lib/gcs';
import Link from 'next/link';
import Image from 'next/image';
import dbConnect from '@/lib/dbConnect';
import Artwork from '@/models/artwork';
import User from '@/models/user';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';

type Props = {
  tags: string;
}

export default async function SearchResultsList({ tags }: Props) {
  let artworksWithSignedUrls: (IArtworkData & { thumbnailUrl: string })[] = [];
  
  // カンマ区切りのタグを配列に変換
  const tagsArray = tags.split(',').map(tag => tag.trim()).filter(Boolean);

  try {
    if (tagsArray.length > 0) {
      await dbConnect();
      
      // ユーザー設定を取得
      let mutedTags: string[] = [];
      let showNSFW = false;
      
      const cookieStore = await cookies();
      const token = cookieStore.get('token')?.value;
      
      if (token) {
        try {
          const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string };
          const user = await User.findById(decoded.id).select('mutedTags showNSFW');
          if (user) {
            mutedTags = user.mutedTags || [];
            showNSFW = user.showNSFW || false;
          }
        } catch {
          // token無効時はゲストとして続行
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
        .limit(100)
        .populate({
          path: 'userId',
          select: 'username',
          model: User,
        });

      // 削除済みユーザーの投稿を除外
      const validArtworks = artworks.filter(artwork => artwork.userId !== null);

      const signedUrlPromises = validArtworks.map(artwork => {
        if (artwork.images && artwork.images.length > 0) {
          return bucket.file(artwork.images[0].path).getSignedUrl({
            version: 'v4',
            action: 'read',
            expires: Date.now() + 15 * 60 * 1000,
          }).then(urls => urls[0]);
        }
        return Promise.resolve('');
      });

      const signedUrls = await Promise.all(signedUrlPromises);
      
      artworksWithSignedUrls = validArtworks.map((artwork, index) => ({
        ...JSON.parse(JSON.stringify(artwork)),
        thumbnailUrl: signedUrls[index],
      }));
    }
  } catch (error) {
    console.error("Failed to fetch search results:", error);
  }

  if (artworksWithSignedUrls.length === 0) {
    return <p className="text-center text-gray-500">条件に一致する作品は見つかりませんでした。</p>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {artworksWithSignedUrls.map((artwork) => (
        <Link href={`/artworks/${artwork._id}`} key={artwork._id} className="group block">
          <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-200 relative">
            <Image
              src={artwork.thumbnailUrl}
              alt={artwork.title}
              fill
              className="object-cover object-center transition-transform group-hover:scale-105"
            />
          </div>
          <h3 className="mt-2 text-sm font-semibold text-gray-800">{artwork.title}</h3>
           {!artwork.isAnonymous && artwork.userId && (
              <p className="mt-1 text-xs text-gray-500">by {artwork.userId.username}</p>
            )}
        </Link>
      ))}
    </div>
  );
}