'use client';

import { useRouter } from "next/navigation";
import LikeButton from "@/components/likeBottom";
import BookmarkButton from "@/components/BookmarkBottom";
import FollowButton from "@/components/FollowButtom";
import { IArtworkData } from "@/models/artwork";
import Link from "next/link";

// isOwnerをpropsとして受け取るように修正
type Props = {
  artwork: IArtworkData;
  isOwner: boolean;
}

export default function ArtworkActions({ artwork, isOwner }: Props) {
  const router = useRouter();

  const handleDelete = async () => {
    if (window.confirm('本当にこの作品を削除しますか？')) {
      // Cookieは自動で送信される
      const res = await fetch(`/api/artworks/${artwork._id}`, {
        method: 'DELETE',
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
            投稿者: 
            <Link href={`/users/${artwork.userId.username}`} className="font-semibold hover:underline">
              {artwork.userId.username}
            </Link>
          </p>
          {/* isOwnerがfalseの時だけフォローボタンを表示 */}
          {!isOwner && <FollowButton targetUserId={artwork.userId._id} />}
        </div>
      )}

      {/* isOwnerがtrueの時だけ削除ボタンを表示 */}
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