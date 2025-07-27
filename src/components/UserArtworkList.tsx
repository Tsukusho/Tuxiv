import { IArtworkData } from '@/models/artwork';
import { bucket } from '@/lib/gcs';
import Link from 'next/link';
import dbConnect from '@/lib/dbConnect';
import Artwork from '@/models/artwork';
import User from '@/models/user';
import { IUserData } from '@/models/user';

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
      // 2. ユーザーIDで作品を検索
      const artworks = await Artwork.find({ 
          userId: user._id, 
          isAnonymous: false // 匿名投稿は非表示
        })
        .sort({ createdAt: -1 })
        .limit(1000); // 表示件数を制限

      // 3. 署名付きURLを生成
      const signedUrlPromises = artworks.map(artwork => {
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
      
      artworksWithSignedUrls = artworks.map((artwork, index) => ({
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