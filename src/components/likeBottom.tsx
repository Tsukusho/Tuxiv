'use client';

import { useState, useEffect } from 'react';

type Props = {
  artworkId: string;
  initialLikeCount: number;
};

export default function LikeButton({ artworkId, initialLikeCount }: Props) {
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLiked, setIsLiked] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkLikeStatus = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLiked(false);
        return;
      }
      try {
        const res = await fetch(`/api/artworks/${artworkId}/like`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setIsLiked(data.isLiked);
        } else {
          setIsLiked(false);
        }
      } catch (error) {
        console.error('Failed to fetch like status:', error);
        setIsLiked(false);
      }
    };
    checkLikeStatus();
  }, [artworkId]);

  const handleLike = async () => {
    if (isLiked === null) return; // 状態が未確定の場合は何もしない

    setIsLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
      alert('いいねするにはログインが必要です。');
      setIsLoading(false);
      return;
    }

    const previousLikeState = isLiked;
    const previousLikeCount = likeCount;

    setIsLiked(!previousLikeState);
    setLikeCount(prev => previousLikeState ? prev - 1 : prev + 1);

    const endpoint = `/api/artworks/${artworkId}/like`;
    const method = previousLikeState ? 'DELETE' : 'POST';

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!res.ok) {
        // エラーが起きたらUIをクリック前の状態に戻す
        setIsLiked(previousLikeState);
        setLikeCount(previousLikeCount);
        const data = await res.json();
        alert(data.error || 'エラーが発生しました。');
      }
    } catch (error) {
      // エラーが起きたらUIをクリック前の状態に戻す
      setIsLiked(previousLikeState);
      setLikeCount(previousLikeCount);
      alert('ネットワークエラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  };
  
  // いいね状態がまだ不明な場合は、ボタンを無効化
  if (isLiked === null) {
    return (
        <button disabled className="px-4 py-2 rounded-full font-semibold flex items-center space-x-2 bg-gray-200 opacity-50">
            <span>❤️</span>
            <span>{likeCount}</span>
        </button>
    );
  }

  return (
    <button
      onClick={handleLike}
      disabled={isLoading}
      className={`px-4 py-2 rounded-full font-semibold transition-colors flex items-center space-x-2 disabled:opacity-50 ${
        isLiked
          ? 'bg-pink-500 text-white'
          : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
      }`}
    >
      <span>❤️</span>
      <span>{likeCount}</span>
    </button>
  );
}