// /src/components/Comments.tsx
'use client';

import { useEffect, useState } from 'react';

// コメントデータの型
interface ICommentData {
  _id: string;
  userId: { _id: string; username: string };
  text: string;
  createdAt: string;
}

export default function Comments({ artworkId }: { artworkId: string }) {
  const [comments, setComments] = useState<ICommentData[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    const fetchComments = async () => {
      const res = await fetch(`/api/artworks/${artworkId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
      setIsLoading(false);
    };
    fetchComments();
  }, [artworkId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setIsPosting(true);

    const res = await fetch(`/api/artworks/${artworkId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: newComment }),
    });

    if (res.ok) {
      const createdComment = await res.json();
      setComments([createdComment, ...comments]);
      setNewComment('');
    } else {
      alert('コメントの投稿に失敗しました。');
    }
    setIsPosting(false);
  };

  return (
    <div className="mt-8 pt-6 border-t">
      <h3 className="text-xl font-semibold mb-4">コメント</h3>
      {/* コメント投稿フォーム */}
      <form onSubmit={handleSubmit} className="mb-6">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="コメントを追加..."
          className="w-full p-2 border rounded-md"
          rows={3}
        />
        <div className="text-right mt-2">
          <button type="submit" disabled={isPosting} className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-gray-400">
            {isPosting ? '投稿中...' : '投稿する'}
          </button>
        </div>
      </form>

      {/* コメント一覧 */}
      <div className="space-y-4">
        {isLoading ? (
          <p>コメントを読み込み中...</p>
        ) : comments.length > 0 ? (
          comments.map(comment => (
            <div key={comment._id} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center mb-2">
                <p className="font-semibold text-sm">{comment.userId.username}</p>
                <p className="text-xs text-gray-500 ml-2">
                  {new Date(comment.createdAt).toLocaleString('ja-JP')}
                </p>
              </div>
              <p className="text-gray-800">{comment.text}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-500">まだコメントはありません。</p>
        )}
      </div>
    </div>
  );
}