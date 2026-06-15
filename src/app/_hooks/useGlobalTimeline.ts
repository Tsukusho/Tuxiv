"use client";

import { useArtworkFeed } from "@/lib/useArtworkFeed";
import { fetchGlobalTimeline } from "./query";

// global TL のデータ層。cursor ベースの無限スクロール取得。
export function useGlobalTimeline() {
  return useArtworkFeed(["timeline", "global"], fetchGlobalTimeline);
}
