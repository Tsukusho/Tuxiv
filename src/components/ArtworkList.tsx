import { IArtworkData } from '@/models/artwork';
import { bucket } from '@/lib/gcs';
import Link from 'next/link';

type ApiResponse = {
  artworks: IArtworkData[];
  totalPages: number;
  currentPage: number;
};

type Props = {
  apiUrl: string;
}

export default async function ArtworkList({ apiUrl }: Props) {
  let artworksWithSignedUrls: (IArtworkData & { thumbnailUrl: string })[] = [];

  try {
    const res = await fetch(apiUrl, {
      cache: 'no-store',
    });
    
    if (res.ok) {
      const data: ApiResponse = await res.json();
      
      const signedUrlPromises = data.artworks.map(artwork => {
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
      
      artworksWithSignedUrls = data.artworks.map((artwork, index) => ({
        ...artwork,
        thumbnailUrl: signedUrls[index],
      }));
    }
  } catch (error) {
    console.error("Failed to fetch artworks:", error);
  }

  if (artworksWithSignedUrls.length === 0) {
    return <p className="text-center text-gray-500">表示できる作品がありません。</p>;
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
          {!artwork.isAnonymous && (
            <p className="mt-1 text-xs text-gray-500">by {artwork.userId.username}</p>
          )}
        </Link>
      ))}
    </div>
  );
}