"use client";

import { useMemo, useState } from "react";
import { useScheduleSearch } from "../_hooks/useScheduleSearch";
import {
  EMPTY_FILTER,
  type FilterGroup,
  type SearchFacets,
  type SearchFilter,
  type SearchMember,
} from "../_types/search";
import FilterPanel from "./FilterPanel";
import HeatmapCalendar from "./HeatmapCalendar";

const EMPTY_FACETS: SearchFacets = { performances: [], grades: [], names: [] };

// 公演×役職セットは AND (全セット合致)、各セットは同一 performance entry で判定。
const matchesGroup = (m: SearchMember, group: FilterGroup) => {
  const roleSet = new Set(group.roleTypeIds);
  return m.performances.some(
    (p) => p.id === group.performanceId && (roleSet.size === 0 || p.roleTypes.some((r) => roleSet.has(r.id))),
  );
};

export default function ResultsDashboard({ eventId }: { eventId: string }) {
  const { data, isLoading, isFetching } = useScheduleSearch(eventId);
  const [activeFilter, setActiveFilter] = useState<SearchFilter>(EMPTY_FILTER);
  const [availableLimit, setAvailableLimit] = useState(1);

  const allMembers = data?.members ?? [];
  const facets = data?.facets ?? EMPTY_FACETS;

  const members = useMemo(() => {
    const gradeSet = new Set(activeFilter.grades);
    const userSet = new Set(activeFilter.userIds);
    return allMembers.filter(
      (m) =>
        activeFilter.groups.every((g) => matchesGroup(m, g)) &&
        (gradeSet.size === 0 || (m.grade !== null && gradeSet.has(m.grade))) &&
        (userSet.size === 0 || userSet.has(m.userId)),
    );
  }, [allMembers, activeFilter]);

  if (isLoading && !data) return <div className="text-center p-8">読み込み中...</div>;

  return (
    <div className="flex flex-col md:flex-row gap-8">
      <FilterPanel
        facets={facets}
        filteredCount={members.length}
        availableLimit={availableLimit}
        onAvailableLimitChange={setAvailableLimit}
        onApply={setActiveFilter}
        onClear={() => setActiveFilter(EMPTY_FILTER)}
        isFetching={isFetching}
      />
      <HeatmapCalendar members={members} availableLimit={availableLimit} />
    </div>
  );
}
