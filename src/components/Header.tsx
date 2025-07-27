'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useEffect, useState } from 'react';

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
        placeholder="タグを検索"
        className="w-full px-4 py-2 border rounded-full text-sm"
      />
    </form>
  );
}

type Props = {
    isLoggedIn: boolean;
}

export default function Header({ isLoggedIn }: Props) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.refresh();
  };
  
  // ページ遷移時にメニューを閉じる
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* ロゴとグローバルリンク */}
        <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center">
              <Image 
                src="/logo.png"
                alt="Tuxiv Logo" 
                width={80}
                height={32}
                priority
              />
            </Link>
            <div className="hidden md:flex items-center space-x-4">
              <Link href="/" className={`text-gray-600 hover:text-blue-600 ${pathname === '/' ? 'font-bold text-blue-600' : ''}`}>
                グローバル
              </Link>
              {isLoggedIn && (
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
        </div>

        <SearchForm />

        {/* 右側のメニュー */}
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-4">
            {isLoggedIn ? (
              <>
                <Link href="/artworks/new" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-semibold text-sm">
                  投稿する
                </Link>
                <Link href="/profile" className="text-gray-600 hover:text-blue-600 text-sm">マイページ</Link>
                <Link href="/settings" className="text-gray-600 hover:text-blue-600 text-sm">設定</Link>
                <button onClick={handleLogout} className="text-gray-600 hover:text-blue-600 text-sm">ログアウト</button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-gray-600 hover:text-blue-600 text-sm">ログイン</Link>
                <Link href="/register" className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 font-semibold text-sm">新規登録</Link>
              </>
            )}
          </div>
          <button onClick={() => setIsMenuOpen(true)} className="md:hidden p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </nav>

      {/* ★ ハンバーガーメニュー本体 */}
      <div className={`fixed top-0 right-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4">
          <button onClick={() => setIsMenuOpen(false)} className="float-right mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="clear-both flex flex-col space-y-4 mt-8">
            {isLoggedIn ? (
              <>
                <Link href="/profile" className="text-gray-800 hover:text-blue-600">マイページ</Link>
                <Link href="/artworks/new" className="text-gray-800 hover:text-blue-600">投稿する</Link>
                <Link href="/following" className="text-gray-800 hover:text-blue-600">フォロー中</Link>
                <Link href="/bookmarks" className="text-gray-800 hover:text-blue-600">ブックマーク</Link>
                <Link href="/settings" className="text-gray-800 hover:text-blue-600">設定</Link>
                <button onClick={handleLogout} className="text-left text-gray-800 hover:text-blue-600">ログアウト</button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-gray-800 hover:text-blue-600">ログイン</Link>
                <Link href="/register" className="text-gray-800 hover:text-blue-600">新規登録</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}