// /src/components/BookmarkList.tsx
'use client';

import { IArtworkData } from '@/models/artwork';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function BookmarkList() {
  const [artworks, setArtworks] = useState<(IArtworkData & { thumbnailUrl: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
              const res = await fetch('/api/users/me/bookmarks', {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
        if (res.ok) {
          const data = await res.json();
          setArtworks(data.artworks); 
        }
      } catch (error) {
        console.error("Failed to fetch bookmarks:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBookmarks();
  }, []);

  if (isLoading) {
    return <p className="text-center text-gray-500">読み込み中...</p>;
  }
  
  if (artworks.length === 0) {
    return <p className="text-center text-gray-500">ブックマークした作品はまだありません。</p>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {artworks.map((artwork) => (
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