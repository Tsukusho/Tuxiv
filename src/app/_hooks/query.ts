import type { ArtworkPage } from "@/app/api/timeline/_artworks";
import { fetchClient } from "@/lib/fetchClient";

// global TL の1ページ取得。cursor 未指定なら先頭から。
export function fetchGlobalTimeline(cursor?: string | null) {
  const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  return fetchClient<ArtworkPage>(`/api/timeline/global${qs}`);
}
