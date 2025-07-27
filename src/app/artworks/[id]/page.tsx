// /src/app/artworks/[id]/page.tsx

import dbConnect from "@/lib/dbConnect";
import Artwork, { IArtworkData } from "@/models/artwork";
import User from "@/models/user";
import { notFound } from "next/navigation";
import { bucket } from '@/lib/gcs';
import ArtworkActions from "@/components/ArtworkActions";
import Comments from "@/components/Comments";
import Link from 'next/link';

// データ取得ロジックはサーバーコンポーネントに残す
async function getArtwork(id: string): Promise<IArtworkData | null> {
  try {
    await dbConnect();
    const artwork = await Artwork.findById(id).populate({
      path: 'userId',
      select: 'username',
      model: User,
    });

    if (!artwork) return null;

    const options = {
      version: 'v4' as const,
      action: 'read' as const,
      expires: Date.now() + 15 * 60 * 1000,
    };

    const artworkObject = JSON.parse(JSON.stringify(artwork));
    
    const signedUrls = await Promise.all(
      artwork.images.map((image: any) => bucket.file(image.path).getSignedUrl(options))
    );

    artworkObject.images = artworkObject.images.map((image: any, index: number) => ({
        ...image,
        url: signedUrls[index][0],
    }));

    return artworkObject;
  } catch (error) {
    console.error(error);
    return null;
  }
}

// ページコンポーネントはサーバーコンポーネントのまま
export default async function ArtworkDetailPage({ params }: { params: { id: string } }) {
  const artwork = await getArtwork(params.id);

  if (!artwork) {
    notFound();
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {/* 画像表示エリア */}
        <div className="bg-gray-200">
          {artwork.images.map((image, index) => (
            <img 
              key={index} 
              src={image.url} 
              alt={`${artwork.title} - 画像${index + 1}`}
              className="w-full h-auto object-contain"
            />
          ))}
        </div>

        {/* 作品情報エリア */}
        <div className="p-6">
          {/* ★UI部分をArtworkActionsコンポーネントに任せる */}
          <ArtworkActions artwork={artwork} />

          {/* タグ表示 */}
          <div className="flex flex-wrap gap-2 mb-4">
            {artwork.tags.map((tag, index) => (
              <Link 
                href={`/search?tags=${encodeURIComponent(tag)}`} 
                key={index} 
                className="bg-gray-200 text-gray-800 text-xs font-semibold px-2.5 py-0.5 rounded-full hover:bg-blue-200 hover:text-blue-800 transition-colors"
              >
                {tag}
              </Link>
            ))}
          </div>

          {/* 説明文 */}
          <p className="text-gray-700 whitespace-pre-wrap">{artwork.description}</p>
          <Comments artworkId={artwork._id} />
        </div>
      </div>
    </main>
  );
}