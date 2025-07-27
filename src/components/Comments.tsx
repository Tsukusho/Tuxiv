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
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">コメント ({comments.length})</h3>
      
      {/* コメント投稿フォーム */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="コメントを追加..."
          className="input-field w-full resize-none"
          rows={3}
        />
        <div className="flex justify-end">
          <button 
            type="submit" 
            disabled={isPosting || !newComment.trim()} 
            className="btn-primary text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isPosting ? '投稿中...' : 'コメントする'}
          </button>
        </div>
      </form>

      {/* コメント一覧 */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">コメントを読み込み中...</p>
          </div>
        ) : comments.length > 0 ? (
          comments.map(comment => (
            <div key={comment._id} className="flex space-x-3 p-4 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-blue-600">
                  {comment.userId.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <p className="font-semibold text-sm text-gray-900">{comment.userId.username}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(comment.createdAt).toLocaleString('ja-JP', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{comment.text}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-gray-500 font-medium">まだコメントはありません</p>
            <p className="text-sm text-gray-400">最初のコメントを投稿してみましょう</p>
          </div>
        )}
      </div>
    </div>
  );
}