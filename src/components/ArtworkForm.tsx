'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface UploadedImage {
  fileName: string;
  fileType: string;
  fileSize: number;
  signedUrl: string;
}

export default function ArtworkForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [isNSFW, setIsNSFW] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(selectedFiles);
      setUploadedImages([]);
      setUploadProgress({});
      
      // 自動的にファイルのアップロードを開始
      await uploadFiles(selectedFiles);
    }
  };

  const uploadFiles = async (filesToUpload: File[]) => {
    setIsUploading(true);
    setError('');
    const uploaded: UploadedImage[] = [];

    try {
      for (const file of filesToUpload) {
        // 署名付きURL取得
        const signedUrlResponse = await fetch('/api/upload/signed-url', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
          }),
        });

        if (!signedUrlResponse.ok) {
          const errorData = await signedUrlResponse.json();
          throw new Error(errorData.error || '署名付きURL取得に失敗しました');
        }

        const { signedUrl, fileName, fileType, fileSize } = await signedUrlResponse.json();

        // プログレス追跡用のキー
        const progressKey = `${file.name}-${Date.now()}`;
        setUploadProgress(prev => ({ ...prev, [progressKey]: 0 }));

        // GCSへ直接アップロード
        const xhr = new XMLHttpRequest();
        
        await new Promise<void>((resolve, reject) => {
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const percentComplete = (event.loaded / event.total) * 100;
              setUploadProgress(prev => ({ ...prev, [progressKey]: percentComplete }));
            }
          });

          xhr.onload = () => {
            if (xhr.status === 200) {
              uploaded.push({ fileName, fileType, fileSize, signedUrl });
              setUploadProgress(prev => ({ ...prev, [progressKey]: 100 }));
              resolve();
            } else {
              reject(new Error(`アップロードに失敗しました: ${xhr.status}`));
            }
          };

          xhr.onerror = () => reject(new Error('アップロードエラーが発生しました'));

          xhr.open('PUT', signedUrl);
          xhr.setRequestHeader('Content-Type', fileType);
          xhr.send(file);
        });
      }

      setUploadedImages(uploaded);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'アップロードに失敗しました');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (uploadedImages.length === 0) {
      setError('画像のアップロードが完了していません。');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/artworks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title,
          description,
          tags: tags.split(',').map(tag => tag.trim()),
          isNSFW,
          isAnonymous,
          uploadedImages,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '投稿に失敗しました。');
      }

      router.push(`/artworks/${data._id}`);

    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('予期せぬエラーが発生しました。');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="card p-8">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">作品を投稿する</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
                  タイトル <span className="text-red-500">*</span>
                </label>
                <input
                  id="title" 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  required
                  className="input-field w-full"
                  placeholder="作品のタイトルを入力してください"
                />
              </div>

              <div>
                <label htmlFor="images" className="block text-sm font-semibold text-gray-700 mb-2">
                  画像ファイル <span className="text-red-500">*</span>
                </label>
                <div className="input-field w-full">
                  <input
                    id="images" 
                    type="file" 
                    multiple 
                    onChange={handleFileChange} 
                    required
                    accept="image/*"
                    className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer"
                  />
                </div>
                {files.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-2">{files.length}個のファイルが選択されています</p>
                    
                    {isUploading && (
                      <div className="space-y-2">
                        <p className="text-sm text-blue-600">アップロード中...</p>
                        {Object.entries(uploadProgress).map(([key, progress]) => (
                          <div key={key} className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {uploadedImages.length > 0 && !isUploading && (
                      <div className="text-sm text-green-600">
                        ✓ {uploadedImages.length}個のファイルのアップロードが完了しました
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                  作品について
                </label>
                <textarea
                  id="description" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  rows={5}
                  className="input-field w-full resize-none"
                />
              </div>

              <div>
                <label htmlFor="tags" className="block text-sm font-semibold text-gray-700 mb-2">
                  タグ <span className="text-red-500">*</span>
                </label>
                <input
                  id="tags" 
                  type="text" 
                  value={tags} 
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="例：やが君,やがて君になる"
                  className="input-field w-full"
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  半角カンマ区切りで入力してください。検索や検索避けに使用されるため、できるだけ多く入力することをお勧めします。
                </p>
              </div>

              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700">投稿設定</h3>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={isAnonymous} 
                    onChange={(e) => setIsAnonymous(e.target.checked)} 
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">匿名で投稿する</span>
                    <p className="text-xs text-gray-500">ユーザー名を表示せずに投稿します</p>
                  </div>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={isNSFW} 
                    onChange={(e) => setIsNSFW(e.target.checked)} 
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">NSFW (閲覧注意)</span>
                    <p className="text-xs text-gray-500">成人向けコンテンツや閲覧注意が必要な作品にチェック</p>
                  </div>
                </label>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm font-medium">{error}</p>
                </div>
              )}

              <button 
                type="submit" 
                disabled={isSubmitting || isUploading || uploadedImages.length === 0} 
                className="btn-primary w-full py-3 text-base disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '投稿中...' : 
                 isUploading ? 'アップロード中...' : 
                 uploadedImages.length === 0 ? '画像をアップロードしてください' :
                 '作品を投稿する'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}