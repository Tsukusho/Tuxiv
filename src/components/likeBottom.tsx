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
      try {
        const res = await fetch(`/api/artworks/${artworkId}/like`, {
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
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

    const previousLikeState = isLiked;
    const previousLikeCount = likeCount;

    setIsLiked(!previousLikeState);
    setLikeCount(prev => previousLikeState ? prev - 1 : prev + 1);

    const endpoint = `/api/artworks/${artworkId}/like`;
    const method = previousLikeState ? 'DELETE' : 'POST';

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!res.ok) {
        // エラーが起きたらUIをクリック前の状態に戻す
        setIsLiked(previousLikeState);
        setLikeCount(previousLikeCount);
        const data = await res.json();
        alert(data.error || 'エラーが発生しました。');
      }
    } catch {
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
      <button disabled className="flex items-center space-x-2 px-4 py-2 rounded-full font-semibold bg-gray-100 text-gray-400 cursor-not-allowed">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        <span>{likeCount}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleLike}
      disabled={isLoading}
      className={`flex items-center space-x-2 px-4 py-2 rounded-full font-semibold transition-all duration-200 disabled:opacity-50 ${
        isLiked
          ? 'bg-red-50 text-red-600 hover:bg-red-100'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-5 w-5" 
        fill={isLiked ? "currentColor" : "none"} 
        viewBox="0 0 24 24" 
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
      <span>{likeCount}</span>
    </button>
  );
}