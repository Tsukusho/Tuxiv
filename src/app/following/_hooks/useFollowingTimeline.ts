"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchFollowingTimeline } from "./query";

// following TL のデータ層。ユーザー単位グループを取得。
export function useFollowingTimeline() {
  const query = useQuery({
    queryKey: ["timeline", "following"],
    queryFn: fetchFollowingTimeline,
  });

  return {
    groups: query.data?.userArtworks ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
