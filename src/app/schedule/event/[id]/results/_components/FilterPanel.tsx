"use client";

import { useState } from "react";
import type { FilterGroup, SearchFacets, SearchFilter } from "../_types/search";

interface Opt {
  value: string;
  label: string;
  count: number;
}

// 左側のフィルター操作パネル。下書き (draft) state を内部で持ち、
// 「適用」で確定フィルタを onApply に渡す (絞り込み自体は親が担う)。
export default function FilterPanel({
  facets,
  filteredCount,
  availableLimit,
  onAvailableLimitChange,
  onApply,
  onClear,
  isFetching,
}: {
  facets: SearchFacets;
  filteredCount: number;
  availableLimit: number;
  onAvailableLimitChange: (value: number) => void;
  onApply: (filter: SearchFilter) => void;
  onClear: () => void;
  isFetching: boolean;
}) {
  const [draftGroups, setDraftGroups] = useState<FilterGroup[]>([]);
  const [draftGrades, setDraftGrades] = useState<number[]>([]);
  const [draftUserIds, setDraftUserIds] = useState<string[]>([]);

  const performanceOptions = (excludeIndex: number): Opt[] =>
    facets.performances
      .filter((p) => !draftGroups.some((g, i) => i !== excludeIndex && g.performanceId === p.id))
      .map((p) => ({ value: p.id, label: p.label, count: p.count }));

  const roleOptions = (performanceId: string): Opt[] =>
    (facets.performances.find((p) => p.id === performanceId)?.roleTypes ?? []).map((r) => ({
      value: r.id,
      label: r.name,
      count: r.count,
    }));

  const addGroup = () => setDraftGroups([...draftGroups, { performanceId: "", roleTypeIds: [] }]);
  const removeGroup = (index: number) => setDraftGroups(draftGroups.filter((_, i) => i !== index));
  const setGroupPerformance = (index: number, performanceId: string) =>
    setDraftGroups(draftGroups.map((g, i) => (i === index ? { performanceId, roleTypeIds: [] } : g)));
  const toggleGroupRole = (index: number, roleId: string) =>
    setDraftGroups(
      draftGroups.map((g, i) => {
        if (i !== index) return g;
        const on = g.roleTypeIds.includes(roleId);
        return { ...g, roleTypeIds: on ? g.roleTypeIds.filter((r) => r !== roleId) : [...g.roleTypeIds, roleId] };
      }),
    );
  const setGroupRoles = (index: number, roleTypeIds: string[]) =>
    setDraftGroups(draftGroups.map((g, i) => (i === index ? { ...g, roleTypeIds } : g)));

  const toggleGrade = (value: number, checked: boolean) =>
    setDraftGrades(checked ? [...draftGrades, value] : draftGrades.filter((v) => v !== value));
  const toggleName = (userId: string, checked: boolean) =>
    setDraftUserIds(checked ? [...draftUserIds, userId] : draftUserIds.filter((v) => v !== userId));

  const applyFilters = () =>
    onApply({
      groups: draftGroups.filter((g) => g.performanceId),
      grades: draftGrades,
      userIds: draftUserIds,
    });

  const clearAll = () => {
    setDraftGroups([]);
    setDraftGrades([]);
    setDraftUserIds([]);
    onClear();
  };

  const canAddGroup = performanceOptions(-1).length > 0;

  // 選択中の公演（名簿表示用）
  const selectedPerformanceIds = new Set(draftGroups.map((g) => g.performanceId).filter(Boolean));
  const selectedPerformances = facets.performances.filter((p) => selectedPerformanceIds.has(p.id));

  return (
    <div className="md:w-1/3 space-y-4 p-4 border rounded-lg shadow-sm bg-white self-start">
      <div className="flex items-center justify-between border-b pb-2">
        <h2 className="text-xl font-semibold">フィルター</h2>
        <span className="text-sm text-gray-500">
          対象: {filteredCount}人{isFetching && <span className="ml-1 text-gray-400">更新中…</span>}
        </span>
      </div>

      <div>
        <p className="text-sm font-medium">✅ 「空き」が {availableLimit} 人以上</p>
        <input
          type="range"
          min={0}
          max={filteredCount}
          value={availableLimit}
          onChange={(e) => onAvailableLimitChange(Number(e.target.value))}
          className="w-full"
        />
      </div>

      {/* 公演×役職セット (AND) */}
      <div className="space-y-3">
        <p className="text-sm font-medium">公演 × 役職</p>
        {draftGroups.map((g, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: セットは順序のみ意味を持つ
          <div key={i} className="space-y-2 p-2 border rounded-md bg-gray-50">
            <select
              value={g.performanceId}
              onChange={(e) => setGroupPerformance(i, e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm"
            >
              <option value="">公演を選択</option>
              {performanceOptions(i).map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}（{p.count}人）
                </option>
              ))}
            </select>

            {g.performanceId &&
              (roleOptions(g.performanceId).length === 0 ? (
                <p className="text-sm text-gray-400">この公演に役職がありません</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {roleOptions(g.performanceId).map((r) => {
                    const on = g.roleTypeIds.includes(r.value);
                    return (
                      <button
                        type="button"
                        key={r.value}
                        onClick={() => toggleGroupRole(i, r.value)}
                        className={`rounded-2xl border px-3 py-1 text-xs font-medium transition-colors ${
                          on
                            ? "border-[#1976d2] bg-[#e3f2fd] text-[#1976d2]"
                            : "border-gray-300 bg-white text-gray-500 hover:bg-gray-100"
                        }`}
                      >
                        {r.label}
                      </button>
                    );
                  })}
                </div>
              ))}

            <div className="flex items-center justify-between">
              <button type="button" onClick={() => removeGroup(i)} className="text-xs text-red-600">
                × このセットを削除
              </button>
              {g.performanceId && roleOptions(g.performanceId).length > 0 && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setGroupRoles(
                        i,
                        roleOptions(g.performanceId).map((r) => r.value),
                      )
                    }
                    className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200"
                  >
                    全選択
                  </button>
                  <button
                    type="button"
                    onClick={() => setGroupRoles(i, [])}
                    className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200"
                  >
                    全解除
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={addGroup}
          disabled={!canAddGroup}
          className="text-sm text-indigo-600 disabled:text-gray-400"
        >
          + 公演を追加
        </button>
      </div>

      {/* 学年 (チェックボックス) */}
      <div>
        <p className="text-sm font-medium">学年で絞り込み</p>
        {facets.grades.length === 0 ? (
          <p className="text-sm text-gray-400">学年データなし</p>
        ) : (
          facets.grades.map((gr) => (
            <label key={gr.value} className="flex items-center justify-between">
              <span className="flex items-center">
                <input
                  type="checkbox"
                  checked={draftGrades.includes(gr.value)}
                  onChange={(e) => toggleGrade(gr.value, e.target.checked)}
                  className="mr-2"
                />
                {gr.value}
              </span>
              <span className="text-sm text-gray-500">{gr.count}人</span>
            </label>
          ))
        )}
      </div>

      {/* 役職名簿から名前を選択 (折りたたみ) */}
      <details className="border-t pt-2">
        <summary className="text-sm font-medium cursor-pointer">役職名簿から名前を選択</summary>
        <div className="mt-2 space-y-3">
          {selectedPerformances.length === 0 ? (
            <p className="text-sm text-gray-400">公演を選択すると名簿が出ます</p>
          ) : (
            selectedPerformances.map((p) => {
              const roles = p.roleTypes.filter((r) => r.members.length > 0);
              return (
                <div key={p.id}>
                  <p className="text-sm font-semibold">{p.label}</p>
                  {roles.length === 0 ? (
                    <p className="text-sm text-gray-400 pl-2">メンバーなし</p>
                  ) : (
                    roles.map((r) => (
                      <div key={r.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 pl-2 mt-1">
                        <span className="text-sm text-gray-600">{r.name}：</span>
                        {r.members.map((mem) => (
                          <label key={mem.userId} className="inline-flex items-center text-sm">
                            <input
                              type="checkbox"
                              checked={draftUserIds.includes(mem.userId)}
                              onChange={(e) => toggleName(mem.userId, e.target.checked)}
                              className="mr-1"
                            />
                            {mem.name}
                          </label>
                        ))}
                      </div>
                    ))
                  )}
                </div>
              );
            })
          )}
        </div>
      </details>

      {/* 名前一覧 (折りたたみ) */}
      <details className="border-t pt-2">
        <summary className="text-sm font-medium cursor-pointer">名前で絞り込み（一覧）</summary>
        <div className="mt-2">
          <div className="flex justify-end gap-2 mb-1">
            <button
              type="button"
              onClick={() => setDraftUserIds(facets.names.map((n) => n.userId))}
              className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200"
            >
              全選択
            </button>
            <button
              type="button"
              onClick={() => setDraftUserIds([])}
              className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200"
            >
              全解除
            </button>
          </div>
          {facets.names.length === 0 ? (
            <p className="text-sm text-gray-400">対象者なし</p>
          ) : (
            facets.names.map((n) => (
              <label key={n.userId} className="flex items-center">
                <input
                  type="checkbox"
                  checked={draftUserIds.includes(n.userId)}
                  onChange={(e) => toggleName(n.userId, e.target.checked)}
                  className="mr-2"
                />
                {n.name}
              </label>
            ))
          )}
        </div>
      </details>

      <div className="pt-4 border-t flex gap-2">
        <button type="button" onClick={clearAll} className="flex-1 text-sm py-2 rounded-md border hover:bg-gray-50">
          すべて解除
        </button>
        <button
          type="button"
          onClick={applyFilters}
          className="flex-1 text-sm py-2 rounded-md bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
        >
          適用
        </button>
      </div>
    </div>
  );
}
