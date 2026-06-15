"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchScheduleMembers } from "./query";

export function useScheduleSearch(eventId: string) {
  return useQuery({
    queryKey: ["schedule-search", eventId],
    queryFn: () => fetchScheduleMembers(eventId),
    enabled: Boolean(eventId),
  });
}
