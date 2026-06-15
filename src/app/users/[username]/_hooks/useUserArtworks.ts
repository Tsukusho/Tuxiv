"use client";

import { useArtworkFeed } from "@/lib/useArtworkFeed";
import { fetchUserArtworks } from "./query";

// その人の作品のデータ層。cursor ベースの無限スクロール取得。
export function useUserArtworks(username: string) {
  return useArtworkFeed(["user-artworks", username], (cursor) => fetchUserArtworks(username, cursor));
}
