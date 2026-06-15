import { fetchClient } from "@/lib/fetchClient";
import type { SearchResponse } from "../_types/search";

// 全メンバー + facets を一度だけ取得する。
export function fetchScheduleMembers(eventId: string) {
  return fetchClient<SearchResponse>(`/api/schedule/events/${eventId}/search`);
}
