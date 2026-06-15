import type { ArtworkItem } from "@/app/api/timeline/_artworks";
import { fetchClient } from "@/lib/fetchClient";

export type FollowingTimelineGroup = {
  user: { _id: string; username: string };
  artworks: ArtworkItem[];
};

// following TL はユーザー単位グループを一括取得 (cursor なし)。
export function fetchFollowingTimeline() {
  return fetchClient<{ userArtworks: FollowingTimelineGroup[] }>("/api/timeline/following");
}
