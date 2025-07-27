'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ArtworkForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [isNSFW, setIsNSFW] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('tags', tags);
    formData.append('isNSFW', String(isNSFW));
    formData.append('isAnonymous', String(isAnonymous));
    files.forEach(file => {
      formData.append('images', file);
    });

    const token = localStorage.getItem('token');
    if (!token) {
      setError('ログインが必要です。');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/artworks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '投稿に失敗しました。');
      }

      router.push(`/artworks/${data._id}`);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto p-8 border rounded-lg shadow-lg bg-white">
      <h2 className="text-3xl font-bold text-center text-gray-800">作品を投稿する</h2>
      
      <div>
        <label htmlFor="title" className="block mb-2 font-semibold text-gray-700">タイトル (必須)</label>
        <input
          id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
          className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="images" className="block mb-2 font-semibold text-gray-700">画像ファイル (必須)</label>
        <input
          id="images" type="file" multiple onChange={handleFileChange} required
          className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      <div>
        <label htmlFor="description" className="block mb-2 font-semibold text-gray-700">説明</label>
        <textarea
          id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
          className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="tags" className="block mb-2 font-semibold text-gray-700">タグ (カンマ区切り)</label>
        <input
          id="tags" type="text" value={tags} onChange={(e) => setTags(e.target.value)}
          placeholder="例: オリジナル, 風景, 女の子"
          className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="space-y-2">
        <label className="flex items-center space-x-3">
          <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"/>
          <span className="text-gray-700">匿名で投稿する</span>
        </label>
        <label className="flex items-center space-x-3">
          <input type="checkbox" checked={isNSFW} onChange={(e) => setIsNSFW(e.target.checked)} className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"/>
          <span className="text-gray-700">NSFW (閲覧注意)</span>
        </label>
      </div>

      {error && <p className="text-red-600 font-bold text-center">{error}</p>}

      <button type="submit" disabled={isSubmitting} className="w-full py-3 px-4 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
        {isSubmitting ? '投稿中...' : '投稿する'}
      </button>
    </form>
  );
}