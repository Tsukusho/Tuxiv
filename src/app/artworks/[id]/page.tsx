// /src/app/artworks/[id]/page.tsx

import dbConnect from "@/lib/dbConnect";
import Artwork, { IArtworkData } from "@/models/artwork";
import User from "@/models/user";
import { notFound } from "next/navigation";
import { bucket } from '@/lib/gcs';
import ArtworkActions from "@/components/ArtworkActions";
import Comments from "@/components/Comments";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import Link from "next/link";

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

export default async function ArtworkDetailPage({ params }: { params: { id: string } }) {
  const artwork = await getArtwork(params.id);
  
  let loggedInUserId: string | null = null;
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
      loggedInUserId = decoded.id;
    }
  } catch (error) {
    console.log("Token verification failed, user is not logged in.");
  }
  
  const isOwner = artwork?.userId?._id === loggedInUserId;

  if (!artwork) {
    notFound();
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden max-w-5xl mx-auto">
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
          <ArtworkActions artwork={artwork} isOwner={isOwner} />

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