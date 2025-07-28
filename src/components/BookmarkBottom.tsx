'use client';

import { useState, useEffect } from 'react';

type Props = {
  artworkId: string;
};

export default function BookmarkButton({ artworkId }: Props) {
  const [isBookmarked, setIsBookmarked] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkBookmarkStatus = async () => {
      try {
        const res = await fetch(`/api/artworks/${artworkId}/bookmark`, {
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include', // Cookieを確実に送信
        });
        if (res.ok) {
          const data = await res.json();
          setIsBookmarked(data.isBookmarked);
        } else {
          console.error('Bookmark status fetch failed:', res.status, res.statusText);
          setIsBookmarked(false);
        }
      } catch (error) {
        console.error('Failed to fetch bookmark status:', error);
        setIsBookmarked(false);
      }
    };
    checkBookmarkStatus();
  }, [artworkId]);

  const handleBookmark = async () => {
    if (isBookmarked === null) return;
    setIsLoading(true);
    const previousBookmarkState = isBookmarked;
    setIsBookmarked(!previousBookmarkState);

    const endpoint = `/api/artworks/${artworkId}/bookmark`;
    const method = previousBookmarkState ? 'DELETE' : 'POST';

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Cookieを確実に送信
      });

      if (!res.ok) {
        setIsBookmarked(previousBookmarkState);
        const data = await res.json();
        console.error('Bookmark operation failed:', res.status, data);
        if (res.status === 401) {
          alert('ログインが必要です。再度ログインしてください。');
        } else {
          alert(data.error || 'エラーが発生しました。');
        }
      }
    } catch (error) {
      setIsBookmarked(previousBookmarkState);
      console.error('Bookmark network error:', error);
      alert('ネットワークエラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  };

  if (isBookmarked === null) {
    return (
      <button disabled className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-400 cursor-not-allowed">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      </button>
    );
  }

  return (
    <button
      onClick={handleBookmark}
      disabled={isLoading}
      className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 disabled:opacity-50 ${
        isBookmarked
          ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
      title={isBookmarked ? 'ブックマークを解除' : 'ブックマークに追加'}
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-5 w-5" 
        fill={isBookmarked ? 'currentColor' : 'none'} 
        viewBox="0 0 24 24" 
        stroke="currentColor" 
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
      </svg>
    </button>
  );
}