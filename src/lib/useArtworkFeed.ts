"use client";

import { type QueryKey, useInfiniteQuery } from "@tanstack/react-query";
import type { ArtworkPage } from "@/app/api/timeline/_artworks";

// cursor 無限スクロールの定型。queryKey と「cursor→1ページ」の fetcher を渡すだけ。
// InfiniteArtworkGrid がそのまま消費できる形を返す。
export function useArtworkFeed(queryKey: QueryKey, fetchPage: (cursor?: string | null) => Promise<ArtworkPage>) {
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchPage(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => (last.hasMore ? last.nextCursor : undefined),
  });

  return {
    artworks: query.data?.pages.flatMap((page) => page.artworks) ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  };
}
