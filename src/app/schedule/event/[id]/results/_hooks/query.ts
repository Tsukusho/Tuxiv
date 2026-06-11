import { fetchClient } from "@/lib/fetchClient";
import type { SearchFilter, SearchResponse } from "../_types/search";

// 検索 API の fetchClient バインディング。
export function searchSchedule(eventId: string, filter: SearchFilter) {
  return fetchClient<SearchResponse>(`/api/schedule/events/${eventId}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(filter),
  });
}
