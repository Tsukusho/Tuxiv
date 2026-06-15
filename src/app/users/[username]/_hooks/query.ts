import type { ArtworkPage } from "@/app/api/timeline/_artworks";
import { fetchClient } from "@/lib/fetchClient";

// その人の作品1ページ取得。cursor 未指定なら先頭から。
export function fetchUserArtworks(username: string, cursor?: string | null) {
  const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  return fetchClient<ArtworkPage>(`/api/users/${encodeURIComponent(username)}/artworks${qs}`);
}
