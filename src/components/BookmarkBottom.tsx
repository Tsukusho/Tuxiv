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
        });
        if (res.ok) {
          const data = await res.json();
          setIsBookmarked(data.isBookmarked);
        } else {
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
      });

      if (!res.ok) {
        setIsBookmarked(previousBookmarkState);
        const data = await res.json();
        alert(data.error || 'エラーが発生しました。');
      }
    } catch (error) {
      setIsBookmarked(previousBookmarkState);
      alert('ネットワークエラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  };

  if (isBookmarked === null) {
    return (
      <button disabled className="p-2 rounded-full bg-gray-200 opacity-50">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
      </button>
    );
  }

  return (
    <button
      onClick={handleBookmark}
      disabled={isLoading}
      className="p-2 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={isBookmarked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" className={isBookmarked ? 'text-blue-500' : 'text-gray-600'}/>
      </svg>
    </button>
  );
}