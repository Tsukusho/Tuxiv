import { IArtworkData } from '@/models/artwork';
import { bucket } from '@/lib/gcs';
import Link from 'next/link';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/dbConnect';
import Artwork from '@/models/artwork';
import User from '@/models/user';
import { IUserData } from '@/models/user'; 


const limitPostsNum = 1000; //todo:ページネーション実装したい

// NOTE: サーバーコンポーネントとして、直接データを取得する
export default async function ArtworkList() {
  let artworksWithSignedUrls: (IArtworkData & { thumbnailUrl: string })[] = [];

  try {
    await dbConnect();
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    let mutedTags: string[] = [];
    let query: any = {};

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
        const user = await User.findById(decoded.id).lean<IUserData>();
        if (user) {
          mutedTags = user.mutedTags || [];
          if (!user.showNSFW) {
            query.isNSFW = false;
          } else {
            query.isNSFW = false;
          }
        }
      } catch (e) {
        console.log("Invalid token, proceeding as guest.");
      }
    }
    if (mutedTags.length > 0) {
      query.tags = { $nin: mutedTags };
    }

    const artworks = await Artwork.find(query)
      .sort({ createdAt: -1 })
      .limit(limitPostsNum) 
      .populate({
        path: 'userId',
        select: 'username',
        model: User,
      });

    const signedUrlPromises = artworks.map(artwork => {
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
    
    artworksWithSignedUrls = artworks.map((artwork, index) => ({
      ...JSON.parse(JSON.stringify(artwork)),
      thumbnailUrl: signedUrls[index],
    }));

  } catch (error) {
    console.error("Failed to fetch artworks:", error);
  }

  if (artworksWithSignedUrls.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-gray-400 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-lg text-gray-500 font-medium">表示できる作品がありません</p>
        <p className="text-sm text-gray-400 mt-2">新しい作品を投稿してみましょう</p>
      </div>
    );
  }

  return (
    <div className="artwork-grid">
      {artworksWithSignedUrls.map((artwork) => (
        <Link href={`/artworks/${artwork._id}`} key={artwork._id} className="group block">
          <div className="card overflow-hidden">
            <div className="aspect-square w-full overflow-hidden bg-gray-100">
              <img
                src={artwork.thumbnailUrl}
                alt={artwork.title}
                className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
                {artwork.title}
              </h3>
              <div className="flex items-center justify-between">
                {!artwork.isAnonymous && artwork.userId && (
                  <div className="flex items-center space-x-1">
                    <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-xs font-bold text-gray-600">
                        {artwork.userId.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <Link 
                      href={`/users/${artwork.userId.username}`} 
                      className="text-xs text-gray-500 hover:text-blue-600 hover:underline transition-colors"
                    >
                      {artwork.userId.username}
                    </Link>
                  </div>
                )}
                <div className="flex items-center space-x-3 text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                    <span>{artwork.likeCount || 0}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span>{artwork.commentCount || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}