// /src/components/Header.tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// 検索フォームコンポーネント
function SearchForm() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/search?tags=${encodeURIComponent(query)}`);
  };

  return (
    <form onSubmit={handleSearch} className="flex-1 max-w-md mx-4">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="タグを検索 (例: 猫, 風景)"
        className="w-full px-4 py-2 border rounded-full text-sm"
      />
    </form>
  );
}

export default function Header() {
  const [token, setToken] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setToken(localStorage.getItem('token'));
  }, [pathname]);

const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
        setToken(null);
        router.push('/');
        router.refresh();
    };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-4">
            <Link href="/" className="text-2xl font-bold text-blue-600">
            Tuxiv
            </Link>
            <Link href="/" className={`text-gray-600 hover:text-blue-600 ${pathname === '/' ? 'font-bold text-blue-600' : ''}`}>
            グローバル
            </Link>
            {token && (
              <>
                <Link href="/following" className={`text-gray-600 hover:text-blue-600 ${pathname === '/following' ? 'font-bold text-blue-600' : ''}`}>
                  フォロー中
                </Link>
                <Link href="/bookmarks" className={`text-gray-600 hover:text-blue-600 ${pathname === '/bookmarks' ? 'font-bold text-blue-600' : ''}`}>
                  ブックマーク
                </Link>
              </>
            )}
        </div>

        <SearchForm />

        <div className="flex items-center space-x-4">
          {token ? (
            <>
              <Link href="/artworks/new" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-semibold text-sm">
                投稿する
              </Link>
              <Link href="/profile" className="text-gray-600 hover:text-blue-600 text-sm">
                マイページ
              </Link>
              <Link href="/settings" className="text-gray-600 hover:text-blue-600 text-sm">
                設定
              </Link>
              <button onClick={handleLogout} className="text-gray-600 hover:text-blue-600 text-sm">
                ログアウト
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-gray-600 hover:text-blue-600 text-sm">
                ログイン
              </Link>
              <Link href="/register" className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 font-semibold text-sm">
                新規登録
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}