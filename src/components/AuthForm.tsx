'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  isRegister: boolean;
};

// TODO: isRegister切り替えではなく、componentを分けて切り出す
// TODO: 青リンクをbase componentとして切り出す
// TODO: フォームUIが重複している箇所が多いので切り出す
export default function AuthForm({ isRegister }: Props) {
  const [identifier, setIdentifier] = useState(''); // ログイン時のユーザー名 or 本名
  const [username, setUsername] = useState(''); // 登録時のユーザー名
  const [fullName, setFullName] = useState(''); // 登録時の本名
  const [studentId, setStudentId] = useState(''); // 登録時の学籍番号
  const [password, setPassword] = useState('');
  const [sharedPassword, setSharedPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    
    const body = isRegister
      ? { username, fullName, studentId, password, sharedPassword }
      : { identifier, password };

    try {
          const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include',
    });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'エラーが発生しました。');
        return;
      }

      router.push('/');
      router.refresh();

    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('ネットワークエラーが発生しました。');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              {isRegister ? 'アカウントを作成' : 'ログイン'}
            </h2>
            <p className="text-gray-600 text-sm mt-2">
              {isRegister 
                ? 'Tuxivへようこそ' 
                : 'Tuxivにログイン'
              }
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {isRegister ? (
              <>
                <div>
                  <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
                    ユーザー名 <span className="text-required">*</span>
                  </label>
                  <input 
                    id="username"
                    type="text" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                    required 
                    className="input-field w-full"
                    placeholder="ユーザー名を入力してください"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    他のユーザーから見える表示名です
                  </p>
                </div>
                <div>
                  <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-2">
                    本名 <span className="text-required">*</span>
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="input-field w-full"
                    placeholder="本名を入力してください"
                  />
                </div>
                <div>
                  <label htmlFor="studentId" className="block text-sm font-semibold text-gray-700 mb-2">
                    学籍番号 <span className="text-required">*</span>
                  </label>
                  <input
                    id="studentId"
                    type="text"
                    inputMode="numeric"
                    pattern="\d{9}"
                    maxLength={9}
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value.replace(/\D/g, ''))}
                    required
                    className="input-field w-full"
                    placeholder="例: 202312345"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    s以降の20**~から始まる9桁の数字を入力してください。ログイン時に使用します。
                  </p>
                </div>
              </>
            ) : (
              <div>
                <label htmlFor="identifier" className="block text-sm font-semibold text-gray-700 mb-2">
                  ユーザー名,本名,学籍番号のうちどれか <span className="text-required">*</span>
                </label>
                <input 
                  id="identifier"
                  type="text" 
                  value={identifier} 
                  onChange={(e) => setIdentifier(e.target.value)} 
                  required 
                  className="input-field w-full"
                  placeholder="ユーザー名,本名,学籍番号のうちどれか"
                />
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                パスワード <span className="text-required">*</span>
              </label>
              <input 
                id="password"
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                className="input-field w-full"
                placeholder="パスワードを入力してください"
              />
            </div>

            {isRegister && (
              <div>
                <label htmlFor="sharedPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                  共有パスワード <span className="text-required">*</span>
                </label>
                <input
                  id="sharedPassword"
                  type="password"
                  value={sharedPassword}
                  onChange={(e) => setSharedPassword(e.target.value)}
                  required
                  className="input-field w-full"
                  placeholder="共有パスワードを入力してください"
                />
                <p className="text-xs text-gray-500 mt-1">
                  サービス利用のための共有パスワードです
                </p>
              </div>
            )}

            {error && (
              <div className="p-4 bg-error-bg border border-error-border rounded-lg">
                <p className="text-error text-sm font-medium">{error}</p>
              </div>
            )}

            <button 
              type="submit" 
              className="btn-primary w-full py-3 text-base"
            >
              {isRegister ? 'アカウントを作成' : 'ログイン'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {isRegister ? 'すでにアカウントをお持ちですか？' : 'アカウントをお持ちではありませんか？'}
              <a 
                href={isRegister ? '/login' : '/register'} 
                className="text-blue-600 hover:text-blue-700 font-medium ml-1 hover:underline transition-colors"
              >
                {isRegister ? 'ログイン' : '新規登録'}
              </a>
            </p>
            
            <p className="text-sm text-gray-600 mt-4">
              パスワードを忘れた場合は
              <a
                href="https://discord.com/users/1099882769494048828"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
              >
                作成者
              </a>
              またはWeb管まで
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}