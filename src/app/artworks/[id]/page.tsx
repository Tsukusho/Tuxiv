// /src/app/artworks/[id]/page.tsx

import dbConnect from "@/lib/dbConnect";
import Artwork, { IArtworkData } from "@/models/artwork";
import User from "@/models/user";
import { notFound } from "next/navigation";
import { bucket } from '@/lib/gcs';
import ArtworkActions from "@/components/ArtworkActions";
import Comments from "@/components/Comments";
import TagEditor from "@/components/TagEditor";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import Link from "next/link";
import Image from 'next/image';

interface IImage {
  path: string;
  mimeType: string;
  size: number;
  order: number;
}

async function getArtwork(id: string): Promise<IArtworkData | null> {
  try {
    await dbConnect();
    const artwork = await Artwork.findById(id).populate({
      path: 'userId',
      select: 'username profileImage',
      model: User,
    });

    if (!artwork) return null;

    const options = {
      version: 'v4' as const,
      action: 'read' as const,
      expires: Date.now() + 15 * 60 * 1000,
    };

    const artworkObject = JSON.parse(JSON.stringify(artwork));
    
    // 作品画像のSigned URLを生成
    const signedUrls = await Promise.all(
      artwork.images.map((image: IImage) => bucket.file(image.path).getSignedUrl(options))
    );

    artworkObject.images = artworkObject.images.map((image: IImage, index: number) => ({
        ...image,
        url: signedUrls[index][0],
    }));

    // プロフィール画像のSigned URLを生成
    if (artworkObject.userId && artworkObject.userId.profileImage?.path) {
      try {
        const [profileSignedUrl] = await bucket.file(artworkObject.userId.profileImage.path).getSignedUrl(options);
        artworkObject.userId.profileImageUrl = profileSignedUrl;
      } catch (error) {
        console.warn('プロフィール画像のSigned URL生成に失敗:', error);
      }
    }

    return artworkObject;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export default async function ArtworkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const artwork = await getArtwork(id);
  
  let loggedInUserId: string | null = null;
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
      loggedInUserId = decoded.id;
    }

  } catch (error) {
    // token無効時は未ログインとして続行
  }
  
  const isOwner = artwork?.userId?._id === loggedInUserId;

  if (!artwork) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 画像表示エリア */}
            <div className="lg:col-span-2">
              <div className="card overflow-hidden">
                {artwork.images.map((image, index) => (
                  <Image 
                    key={index} 
                    src={image.url!} 
                    alt={`${artwork.title} - 画像${index + 1}`}
                    width={800}
                    height={800}
                    className="w-full h-auto object-contain bg-gray-100"
                    unoptimized
                  />
                ))}
              </div>
            </div>

            {/* 作品情報エリア */}
            <div className="lg:col-span-1 space-y-6">
              <div className="card p-6">
                <ArtworkActions artwork={artwork} isOwner={isOwner} />

                {/* タグ表示 */}
                {artwork.tags && artwork.tags.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">タグ</h3>
                    <div className="flex flex-wrap gap-2">
                      {artwork.tags.map((tag, index) => (
                        <Link 
                          href={`/search?tags=${encodeURIComponent(tag)}`} 
                          key={index} 
                          className="inline-block bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1 rounded-full hover:bg-blue-100 hover:text-blue-800 transition-colors break-words"
                        >
                          #{tag}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* 所有者のみ: タグ編集UI */}
                {isOwner && (
                  <div className="mb-6">
                    <TagEditor artworkId={artwork._id} initialTags={artwork.tags || []} />
                  </div>
                )}

                {/* 説明文 */}
                {artwork.description && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">作品について</h3>
                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {artwork.description}
                    </p>
                  </div>
                )}

                {/* 作品情報 */}
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">作品情報</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>投稿日</span>
                      <span>{new Date(artwork.createdAt).toLocaleDateString('ja-JP')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>いいね数</span>
                      <span>{artwork.likeCount || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>コメント数</span>
                      <span>{artwork.commentCount || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="card p-6">
                <Comments artworkId={artwork._id} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}