"use client";

import { useEffect, useRef } from "react";
import type { ArtworkItem } from "@/app/api/timeline/_artworks";
import ArtworkCard from "@/components/ArtworkCard";

// cursor 無限スクロールの一覧グリッド
type Props = {
  artworks: ArtworkItem[];
  isLoading: boolean;
  isError: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  emptyMessage?: string;
};

export default function InfiniteArtworkGrid({
  artworks,
  isLoading,
  isError,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  emptyMessage = "表示できる作品がありません",
}: Props) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: "400px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-gray-500">作品を読み込み中...</p>
      </div>
    );
  }

  if (isError) {
    return <p className="text-center text-gray-500 py-16">読み込みに失敗しました。</p>;
  }

  if (artworks.length === 0) {
    return <p className="text-center text-gray-500 py-16">{emptyMessage}</p>;
  }

  return (
    <>
      <div className="artwork-grid">
        {artworks.map((artwork) => (
          <ArtworkCard key={artwork.id} artwork={artwork} />
        ))}
      </div>
      <div ref={sentinelRef} className="h-10" />
      {isFetchingNextPage && <p className="text-center text-gray-500 py-4">読み込み中...</p>}
    </>
  );
}
