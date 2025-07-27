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
        credentials: 'include',
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
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-500">プロフィールを読み込み中...</p>
      </div>
    );
  }
  
  if (!profileData) {
    return (
      <div className="text-center py-16">
        <div className="text-gray-400 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-lg text-gray-500 font-medium">データの読み込みに失敗しました</p>
        <p className="text-sm text-gray-400 mt-2">ログインしているか確認してください</p>
      </div>
    );
  }

  const { user, artworks } = profileData;

  return (
    <div className="space-y-8">
      {/* プロフィールヘッダー */}
      <div className="card p-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-xl font-bold text-blue-600">
              {user.username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 break-words">{user.username}</h1>
            <p className="text-sm text-gray-600 mt-1">フォロワー: {user.followerCount}人</p>
          </div>
        </div>
      </div>

      {/* 投稿一覧 */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">投稿した作品 ({artworks.length})</h2>
          <Link href="/artworks/new" className="btn-primary text-sm">
            新しい作品を投稿
          </Link>
        </div>
        
        {artworks.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-400 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-lg text-gray-500 font-medium">まだ作品を投稿していません</p>
            <p className="text-sm text-gray-400 mt-2">最初の作品を投稿してみましょう</p>
          </div>
        ) : (
          <div className="artwork-grid">
            {artworks.map((artwork) => (
              <Link href={`/artworks/${artwork._id}`} key={artwork._id} className="group block">
                <div className="card overflow-hidden">
                  <div className="aspect-square w-full overflow-hidden bg-gray-100 relative">
                    <img
                      src={artwork.thumbnailUrl}
                      alt={artwork.title}
                      className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-3 left-3 right-3 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="flex items-center space-x-3 text-xs">
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
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {artwork.title}
                    </h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}