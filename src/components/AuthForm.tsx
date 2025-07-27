'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  isRegister: boolean;
};

export default function AuthForm({ isRegister }: Props) {
  const [identifier, setIdentifier] = useState(''); // ユーザー名 or 本名
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [sharedPassword, setSharedPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    
    const body = isRegister
      ? { username: identifier, fullName, password, sharedPassword }
      : { identifier, password, sharedPassword };  

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'エラーが発生しました。');
        return;
      }

      router.push('/');
      router.refresh();

    } catch (err) {
      setError('ネットワークエラーが発生しました。');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto p-8 border rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center">{isRegister ? '新規登録' : 'ログイン'}</h2>
      
      {isRegister ? (
        <>
          <div>
          <label className="block mb-1 font-medium">ユーザー名または本名</label>
            <input type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required className="w-full px-3 py-2 border rounded-md" />
          </div>
        </>
      ) : (
        <div>
          <label className="block mb-1 font-medium">ユーザー名または本名</label>
          <input type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required className="w-full px-3 py-2 border rounded-md" />
        </div>
      )}

      <div>
        <label className="block mb-1 font-medium">パスワード</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-3 py-2 border rounded-md" />
      </div>

      <div>
        <label className="block mb-1 font-medium">共有パスワード</label>
        <input type="password" value={sharedPassword} onChange={(e) => setSharedPassword(e.target.value)} required className="w-full px-3 py-2 border rounded-md" />
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button type="submit" className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">
        {isRegister ? '登録する' : 'ログインする'}
      </button>
    </form>
  );
}