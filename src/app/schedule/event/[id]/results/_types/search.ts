// 日程調整の検索 (公演×役職×学年×名前) API のフロント型。
// サーバーの POST /api/schedule/events/[id]/search のレスポンスに対応。
export interface AvailableSlot {
  start: string;
  end: string;
  type: "available" | "undecided" | "online";
}

export interface MemberPerformance {
  id: string;
  label: string;
  roleTypes: { id: string; name: string }[];
}

export interface SearchMember {
  userId: string;
  name: string;
  grade: number | null;
  performances: MemberPerformance[];
  availableSlots: AvailableSlot[];
  lastInputDate: string | null;
}

export interface RoleFacet {
  id: string;
  name: string;
  count: number;
  members: { userId: string; name: string }[];
}

// 役職は公演ごとにネスト (公演を選ぶ→その公演の役職を選ぶ 階層UIのため)
export interface SearchFacets {
  performances: { id: string; label: string; count: number; roleTypes: RoleFacet[] }[];
  grades: { value: number; count: number }[];
  names: { userId: string; name: string; grade: number | null }[];
}

export interface SearchResponse {
  members: SearchMember[];
  facets: SearchFacets;
}

// 公演×役職セット (公演1つ + その役職複数)。複数セットは AND で結合。
export interface FilterGroup {
  performanceId: string;
  roleTypeIds: string[];
}

// サーバーに送るフィルタ
export interface SearchFilter {
  groups: FilterGroup[];
  grades: number[];
  userIds: string[];
}

export const EMPTY_FILTER: SearchFilter = {
  groups: [],
  grades: [],
  userIds: [],
};
