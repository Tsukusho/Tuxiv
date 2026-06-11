"use client";

import { useQuery } from "@tanstack/react-query";
import type { SearchFilter } from "../_types/search";
import { searchSchedule } from "./query";

// 適用中フィルタごとに検索結果をキャッシュする。filter が変われば再取得。
// facets は毎回返るが未フィルタ集合から算出されるので選択肢・人数は安定する。
export function useScheduleSearch(eventId: string, filter: SearchFilter) {
  return useQuery({
    queryKey: ["schedule-search", eventId, filter],
    queryFn: () => searchSchedule(eventId, filter),
    enabled: Boolean(eventId),
  });
}
