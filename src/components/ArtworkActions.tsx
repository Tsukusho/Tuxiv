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
        credentials: 'include',
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
    <div className="space-y-6">
      {/* タイトルとアクションボタン */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 mb-4 break-words">{artwork.title}</h1>
        <div className="flex items-center space-x-3">
          <LikeButton artworkId={artwork._id} initialLikeCount={artwork.likeCount} />
          <BookmarkButton artworkId={artwork._id} />
        </div>
      </div>

      {/* 投稿者情報 */}
      {!artwork.isAnonymous && (
        <div className="flex items-center justify-between py-4 border-y border-gray-200">
          <div className="flex items-center space-x-3">
            {artwork.userId ? (
              <>
                {(artwork.userId as unknown as { profileImageUrl?: string }).profileImageUrl ? (
                  <img
                    src={(artwork.userId as unknown as { profileImageUrl: string }).profileImageUrl}
                    alt={`${artwork.userId.username}のプロフィール画像`}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">
                      {artwork.userId.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <Link 
                    href={`/users/${artwork.userId.username}`} 
                    className="font-semibold text-gray-900 hover:text-blue-600 transition-colors break-words"
                  >
                    {artwork.userId.username}
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <span className="text-sm font-bold text-gray-400">
                    削除
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-gray-400 italic break-words">
                    削除済みユーザー
                  </span>
                </div>
              </>
            )}
          </div>
          {/* 通常のユーザーでisOwnerがfalseの時だけフォローボタンを表示 */}
          {artwork.userId && !isOwner && <FollowButton targetUserId={artwork.userId._id} />}
        </div>
      )}

      {/* isOwnerがtrueの時だけ削除ボタンを表示 */}
      {isOwner && (
        <div className="pt-4 border-t border-gray-200">
          <button 
            onClick={handleDelete} 
            className="text-sm text-red-600 hover:text-red-700 hover:underline transition-colors font-medium"
          >
            この作品を削除する
          </button>
        </div>
      )}
    </div>
  );
}