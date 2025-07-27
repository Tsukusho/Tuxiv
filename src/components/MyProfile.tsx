// /src/components/MyProfile.tsx
'use client';

import { IArtworkData } from '@/models/artwork';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface ProfileData {
  user: {
    username: string;
    followerCount: number;
  };
  artworks: (IArtworkData & { thumbnailUrl: string })[];
}

export default function MyProfile() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/profile/me', {
          headers: { 'Content-Type': 'application/json' },
        });
        if (res.ok) {
          const data = await res.json();
          setProfileData(data);
        }
      } catch (error) {
        console.error("Failed to fetch profile data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (isLoading) {
    return <p className="text-center text-gray-500 mt-8">読み込み中...</p>;
  }
  
  if (!profileData) {
    return <p className="text-center text-gray-500 mt-8">データの読み込みに失敗しました。ログインしているか確認してください。</p>;
  }

  const { user, artworks } = profileData;

  return (
    <>
      {/* プロフィールヘッダー */}
      <div className="mb-8 p-4 border-b">
        <h1 className="text-2xl font-bold">{user.username}</h1>
        <p className="text-sm text-gray-500">フォロワー: {user.followerCount}人</p>
      </div>

      {/* 投稿一覧 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {artworks.map((artwork) => (
          <Link href={`/artworks/${artwork._id}`} key={artwork._id} className="group block relative">
            <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-200">
              <img
                src={artwork.thumbnailUrl}
                alt={artwork.title}
                className="h-full w-full object-cover object-center transition-transform group-hover:scale-105"
              />
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-xs rounded-b-lg flex justify-start items-center space-x-3">
            {/* いいね数 */}
            <div className="flex items-center space-x-1">
                <span>❤️</span>
                <span>{artwork.likeCount}</span>
            </div>
            {/* コメント数 */}
            <div className="flex items-center space-x-1">
                <span>💬</span>
                <span>{artwork.commentCount}</span>
            </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}