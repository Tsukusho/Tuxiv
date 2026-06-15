"use client";

import Link from "next/link";
import { useFollowingTimeline } from "../_hooks/useFollowingTimeline";

export default function FollowingTimeline() {
  const { groups, isLoading, isError } = useFollowingTimeline();

  if (isLoading) {
    return <p className="text-center text-gray-500">読み込み中...</p>;
  }

  if (isError) {
    return <p className="text-center text-gray-500">読み込みに失敗しました。</p>;
  }

  if (groups.length === 0) {
    return <p className="text-center text-gray-500">フォロー中のユーザーの作品はまだありません。</p>;
  }

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <div key={group.user._id}>
          <Link href={`/users/${group.user.username}`} className="hover:underline">
            <h2 className="text-xl font-bold mb-4 break-words">{group.user.username}</h2>
          </Link>
          {/* 横スクロール用のコンテナ */}
          <div className="flex space-x-4 overflow-x-auto pb-4">
            {group.artworks.map((artwork) => (
              <div key={artwork.id} className="flex-none w-48 md:w-64">
                <Link href={`/artworks/${artwork.id}`} className="group block">
                  <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-200">
                    {artwork.imageUrl && (
                      // biome-ignore lint/performance/noImgElement: 署名URLは動的なため next/image 未使用（既存方針に追従）
                      <img
                        src={artwork.imageUrl}
                        alt={artwork.title}
                        className="h-full w-full object-cover object-center transition-transform group-hover:scale-105"
                      />
                    )}
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
