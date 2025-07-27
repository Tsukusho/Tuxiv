'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [mutedTags, setMutedTags] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      const res = await fetch('/api/users/me', {
      });
      if (res.ok) {
        const data = await res.json();
        setFullName(data.fullName);
        setMutedTags(data.mutedTags.join(', '));
      }
    };
    fetchUserData();
  }, []);

  const handleUpdate = async (e: React.FormEvent, field: 'fullName' | 'password' | 'mutedTags') => {
    e.preventDefault();
    setMessage('');
    
    let body;
    switch(field) {
        case 'fullName': body = { fullName }; break;
        case 'password': body = { password }; break;
        case 'mutedTags': body = { mutedTags: mutedTags.split(',').map(t => t.trim()) }; break;
    }

    const res = await fetch('/api/users/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setMessage(`${field}を更新しました。`);
      if(field === 'password') setPassword('');
    } else {
      const data = await res.json();
      setMessage(`エラー: ${data.error}`);
    }
  };
  
  const handleDeleteAccount = async () => {
    if (window.confirm('本当にアカウントを削除しますか？この操作は元に戻せません。')) {
      const res = await fetch('/api/users/me', {
        method: 'DELETE',
      });

      if (res.ok) {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/');
        router.refresh();
      } else {
        alert('アカウントの削除に失敗しました。');
      }
    }
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6 border-b pb-2">設定</h1>
      {message && <p className="p-4 mb-4 text-sm text-green-800 rounded-lg bg-green-50">{message}</p>}
      
      <div className="space-y-8">
        {/* フルネーム変更機能は作成したが、基本的に1人1アカウントの思想なので、フルネーム変更機能はフロント側には出さない。
        <form onSubmit={(e) => handleUpdate(e, 'fullName')}>
          <h2 className="text-xl font-semibold mb-2">フルネーム変更</h2>
          <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="w-full px-3 py-2 border rounded-md mb-2" />
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">更新</button>
        </form>*/}

        <form onSubmit={(e) => handleUpdate(e, 'password')}>
          <h2 className="text-xl font-semibold mb-2">パスワード変更</h2>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="新しいパスワード" className="w-full px-3 py-2 border rounded-md mb-2" />
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">更新</button>
        </form>
        
        <form onSubmit={(e) => handleUpdate(e, 'mutedTags')}>
          <h2 className="text-xl font-semibold mb-2">ミュートタグ設定</h2>
          <p className="text-sm text-gray-500 mb-2">カンマ区切りで入力してください。これらのタグが含まれる作品はフォロータイムラインに表示されなくなります。</p>
          <input type="text" value={mutedTags} onChange={(e) => setMutedTags(e.target.value)} className="w-full px-3 py-2 border rounded-md mb-2" />
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">更新</button>
        </form>
        
        <div>
            <h2 className="text-xl font-semibold mb-2 text-red-600">アカウント削除</h2>
            <p className="text-sm text-gray-500 mb-2">この操作は元に戻せません。アカウントに関連する全てのデータ（投稿作品、いいね、ブックマーク）が完全に削除されます。</p>
            <button onClick={handleDeleteAccount} className="px-4 py-2 bg-red-600 text-white rounded-md">アカウントを削除する</button>
        </div>
      </div>
    </main>
  );
}