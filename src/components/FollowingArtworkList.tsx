// /src/components/FollowingArtworkList.tsx
'use client';

import { IArtworkData } from '@/models/artwork';
import Link from 'next/link';
import { useEffect, useState } from 'react';

// 新しいデータ構造に合わせた型定義
interface UserArtworkGroup {
  user: {
    _id: string;
    username: string;
  };
  artworks: (IArtworkData & { thumbnailUrl: string })[];
}

export default function FollowingArtworkList() {
  const [userArtworks, setUserArtworks] = useState<UserArtworkGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchArtworks = async () => {
      try {
              const res = await fetch('/api/timeline/following', {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
        if (res.ok) {
          const data = await res.json();
          setUserArtworks(data.userArtworks); 
        }
      } catch (error) {
        console.error("Failed to fetch following artworks:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchArtworks();
  }, []);

  if (isLoading) {
    return <p className="text-center text-gray-500">読み込み中...</p>;
  }
  
  if (userArtworks.length === 0) {
    return <p className="text-center text-gray-500">フォロー中のユーザーの作品はまだありません。</p>;
  }

  return (
    <div className="space-y-8">
      {userArtworks.map((group) => (
        <div key={group.user._id}>
          <Link href={`/users/${group.user.username}`} className="hover:underline">
            <h2 className="text-xl font-bold mb-4 break-words">{group.user.username}</h2>
          </Link>
          {/* 横スクロール用のコンテナ */}
          <div className="flex space-x-4 overflow-x-auto pb-4">
            {group.artworks.map((artwork) => (
              // 各カードの幅を固定
              <div key={artwork._id} className="flex-none w-48 md:w-64">
                <Link href={`/artworks/${artwork._id}`} className="group block">
                  <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-200">
                    <img
                      src={artwork.thumbnailUrl}
                      alt={artwork.title}
                      className="h-full w-full object-cover object-center transition-transform group-hover:scale-105"
                    />
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}