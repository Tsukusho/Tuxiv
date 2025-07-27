// /src/components/ArtworkActions.tsx
'use client';

import { useRouter } from "next/navigation";
import LikeButton from "@/components/likeBottom";
import BookmarkButton from "@/components/BookmarkBottom";
import FollowButton from "@/components/FollowButtom";
import { IArtworkData } from "@/models/artwork";
import { useEffect, useState } from "react";
import jwt from 'jsonwebtoken';

type Props = {
  artwork: IArtworkData;
}

export default function ArtworkActions({ artwork }: Props) {
  const [isOwner, setIsOwner] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && artwork.userId) {
      try {
        const decoded = jwt.decode(token) as { id: string };
        if (artwork.userId._id === decoded.id) {
          setIsOwner(true);
        }
      } catch (e) { console.error(e) }
    }
  }, [artwork.userId]);

  const handleDelete = async () => {
    if (window.confirm('本当にこの作品を削除しますか？')) {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/artworks/${artwork._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        alert('作品を削除しました。');
        router.push('/');
        router.refresh();
      } else {
        alert('削除に失敗しました。');
      }
    }
  };

  return (
    <>
      <div className="flex justify-between items-start mb-2">
        <h1 className="text-3xl font-bold text-gray-800 flex-1 mr-4">{artwork.title}</h1>
        <div className="flex items-center space-x-2">
          <LikeButton artworkId={artwork._id} initialLikeCount={artwork.likeCount} />
          <BookmarkButton artworkId={artwork._id} />
        </div>
      </div>

      {!artwork.isAnonymous && artwork.userId && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-md text-gray-600">
            投稿者: <span className="font-semibold">{artwork.userId.username}</span>
          </p>
          <FollowButton targetUserId={artwork.userId._id} />
        </div>
      )}

      {isOwner && (
        <div className="my-4 border-t pt-4">
          <button onClick={handleDelete} className="text-sm text-red-600 hover:underline">
            この作品を削除する
          </button>
        </div>
      )}
    </>
  );
}