'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import logoImage from '../assets/logo.png';

function SearchForm() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/search?tags=${encodeURIComponent(query)}`);
  };

  return (
    <form onSubmit={handleSearch} className="flex-1 max-w-lg mx-6">
      <div className="relative">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="タグを検索"
          className="input-field w-full pr-12 text-sm placeholder-gray-500"
        />
        <button 
          type="submit"
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>
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
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    router.refresh();
  };
  
  // ページ遷移時にメニューを閉じる
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* ロゴとナビゲーション */}
        <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
              <Image 
                src={logoImage}
                alt="Tuxiv Logo" 
                width={80}
                height={32}
                priority
                placeholder="blur"
              />
            </Link>
            <div className="hidden lg:flex items-center space-x-6">
              <Link 
                href="/" 
                className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                  pathname === '/' ? 'text-blue-600 border-b-2 border-blue-600 pb-1' : 'text-gray-600'
                }`}
              >
                みんなの作品
              </Link>
              {isLoggedIn && (
                <>
                  <Link 
                    href="/following" 
                    className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                      pathname === '/following' ? 'text-blue-600 border-b-2 border-blue-600 pb-1' : 'text-gray-600'
                    }`}
                  >
                    フォロー中
                  </Link>
                  <Link 
                    href="/bookmarks" 
                    className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                      pathname === '/bookmarks' ? 'text-blue-600 border-b-2 border-blue-600 pb-1' : 'text-gray-600'
                    }`}
                  >
                    ブックマーク
                  </Link>
                </>
              )}
            </div>
        </div>

        <SearchForm />

        {/* 右側のメニュー */}
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-3">
            {isLoggedIn ? (
              <>
                <Link href="/artworks/new" className="btn-primary text-sm">
                  投稿する
                </Link>
                <Link href="/profile" className="text-sm text-gray-600 hover:text-blue-600 transition-colors font-medium">
                  マイページ
                </Link>
                <Link href="/settings" className="text-sm text-gray-600 hover:text-blue-600 transition-colors font-medium">
                  設定
                </Link>
                <button 
                  onClick={handleLogout} 
                  className="text-sm text-gray-600 hover:text-blue-600 transition-colors font-medium"
                >
                  ログアウト
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm text-gray-600 hover:text-blue-600 transition-colors font-medium">
                  ログイン
                </Link>
                <Link href="/register" className="btn-secondary text-sm">
                  新規登録
                </Link>
              </>
            )}
          </div>
          <button 
            onClick={() => setIsMenuOpen(true)} 
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </nav>

      {/* ハンバーガーメニュー */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6">
          <button 
            onClick={() => setIsMenuOpen(false)} 
            className="float-right mb-6 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="clear-both flex flex-col space-y-6 mt-8">
            <Link href="/" className="text-gray-800 hover:text-blue-600 transition-colors font-medium py-2">
              みんなの作品
            </Link>
            {isLoggedIn ? (
              <>
                <Link href="/profile" className="text-gray-800 hover:text-blue-600 transition-colors font-medium py-2">
                  マイページ
                </Link>
                <Link href="/artworks/new" className="text-gray-800 hover:text-blue-600 transition-colors font-medium py-2">
                  投稿する
                </Link>
                <Link href="/following" className="text-gray-800 hover:text-blue-600 transition-colors font-medium py-2">
                  フォロー中
                </Link>
                <Link href="/bookmarks" className="text-gray-800 hover:text-blue-600 transition-colors font-medium py-2">
                  ブックマーク
                </Link>
                <Link href="/settings" className="text-gray-800 hover:text-blue-600 transition-colors font-medium py-2">
                  設定
                </Link>
                <button 
                  onClick={handleLogout} 
                  className="text-left text-gray-800 hover:text-blue-600 transition-colors font-medium py-2"
                >
                  ログアウト
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-gray-800 hover:text-blue-600 transition-colors font-medium py-2">
                  ログイン
                </Link>
                <Link href="/register" className="text-gray-800 hover:text-blue-600 transition-colors font-medium py-2">
                  新規登録
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* オーバーレイ */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-30 z-40"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </header>
  );
}