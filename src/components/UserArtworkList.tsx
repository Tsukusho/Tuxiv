import { IArtworkData } from '@/models/artwork';
import { bucket } from '@/lib/gcs';
import Link from 'next/link';
import dbConnect from '@/lib/dbConnect';
import Artwork from '@/models/artwork';
import User from '@/models/user';
import { IUserData } from '@/models/user';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

// usernameをpropsで受け取る
type Props = {
  username: string;
}

export default async function UserArtworkList({ username }: Props) {
  let artworksWithSignedUrls: (IArtworkData & { thumbnailUrl: string })[] = [];

  try {
    await dbConnect();

    // 1. usernameからユーザーを検索してIDを取得
    const user = await User.findOne({ username }).lean<IUserData>();

    if (user) {
      // 2. 閲覧者のフィルタリング設定を取得
      let mutedTags: string[] = [];
      let showNSFW = false;
      
      const cookieStore = await cookies();
      const token = cookieStore.get('token')?.value;
      
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
          const viewer = await User.findById(decoded.id).select('mutedTags showNSFW');
          if (viewer) {
            mutedTags = viewer.mutedTags || [];
            showNSFW = viewer.showNSFW || false;
          }
        } catch (e) {
          console.log("Invalid token, proceeding as guest.");
        }
      }

      // 3. フィルタリングクエリを作成
      const query: Record<string, unknown> = { 
          userId: user._id, 
        isAnonymous: false, // 匿名投稿は非表示
        tags: { $nin: mutedTags }
      };
      
      if (!showNSFW) {
        query.isNSFW = false;
      }

      // 4. ユーザーIDで作品を検索
      const artworks = await Artwork.find(query)
        .sort({ createdAt: -1 })
        .limit(1000); // 表示件数を制限

      // 削除済みユーザーの投稿を除外（通常は発生しないが安全のため）
      const validArtworks = artworks.filter(artwork => artwork.userId);

      // 3. 署名付きURLを生成
      const signedUrlPromises = validArtworks.map(artwork => {
        if (artwork.images && artwork.images.length > 0) {
          return bucket.file(artwork.images[0].path).getSignedUrl({
            version: 'v4',
            action: 'read',
            expires: Date.now() + 24 * 60 * 60 * 1000,
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
    console.error("Failed to fetch user artworks:", error);
  }

  if (artworksWithSignedUrls.length === 0) {
    return <p className="text-center text-gray-500">このユーザーはまだ作品を投稿していません。</p>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {artworksWithSignedUrls.map((artwork) => (
        <Link href={`/artworks/${artwork._id}`} key={artwork._id} className="group block">
          <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-200">
            <img
              src={artwork.thumbnailUrl}
              alt={artwork.title}
              className="h-full w-full object-cover object-center transition-transform group-hover:scale-105"
            />
          </div>
          <h3 className="mt-2 text-sm font-semibold text-gray-800">{artwork.title}</h3>
        </Link>
      ))}
    </div>
  );
}