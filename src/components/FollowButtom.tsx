'use client';

import { useState, useEffect } from 'react';

type Props = {
  targetUserId: string;
};

export default function FollowButton({ targetUserId }: Props) {
  const [isFollowing, setIsFollowing] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkFollowStatus = async () => {
      try {
        const res = await fetch(`/api/users/${targetUserId}/follow`, {
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setIsFollowing(data.isFollowing);
        } else {
          setIsFollowing(false);
        }
      } catch (error) {
        console.error('Failed to fetch follow status:', error);
        setIsFollowing(false);
      }
    };
    checkFollowStatus();
  }, [targetUserId]);

  const handleFollow = async () => {
    if (isFollowing === null) return;
    setIsLoading(true);

    const previousFollowState = isFollowing;
    setIsFollowing(!previousFollowState);

    const endpoint = `/api/users/${targetUserId}/follow`;
    const method = previousFollowState ? 'DELETE' : 'POST';

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!res.ok) {
        setIsFollowing(previousFollowState);
        const data = await res.json();
        alert(data.error || 'エラーが発生しました。');
      }
    } catch (error) {
      setIsFollowing(previousFollowState);
      alert('ネットワークエラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFollowing === null) {
    return <div className="h-9 w-24 bg-gray-200 rounded-full animate-pulse" />;
  }

  return (
    <button
      onClick={handleFollow}
      disabled={isLoading}
      className={`px-5 py-2 rounded-full font-semibold text-sm transition-all duration-200 disabled:opacity-50 ${
        isFollowing
          ? 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
          : 'btn-primary'
      }`}
    >
      {isFollowing ? 'フォロー中' : 'フォロー'}
    </button>
  );
}