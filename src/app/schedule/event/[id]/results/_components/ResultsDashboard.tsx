"use client";

import type { EventInput } from "@fullcalendar/core";
import jaLocale from "@fullcalendar/core/locales/ja";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import { type ReactNode, useMemo, useRef, useState } from "react";
import { useScheduleSearch } from "../_hooks/useScheduleSearch";
import { EMPTY_FILTER, type FilterGroup, type SearchFacets, type SearchFilter } from "../_types/search";

interface Opt {
  value: string;
  label: string;
  count: number;
}

const EMPTY_FACETS: SearchFacets = { performances: [], grades: [], names: [] };
const SLOT_MS = 30 * 60 * 1000;

export default function ResultsDashboard({ eventId }: { eventId: string }) {
  const [activeFilter, setActiveFilter] = useState<SearchFilter>(EMPTY_FILTER);
  const [draftGroups, setDraftGroups] = useState<FilterGroup[]>([]);
  const [draftGrades, setDraftGrades] = useState<number[]>([]);
  const [draftUserIds, setDraftUserIds] = useState<string[]>([]);

  const [availableLimit, setAvailableLimit] = useState(1); // 「空き」が N 人以上のスロットだけ表示 (クライアント)
  const [popover, setPopover] = useState<{ content: ReactNode; x: number; y: number } | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isFetching } = useScheduleSearch(eventId, activeFilter);
  const members = data?.members ?? [];
  const facets = data?.facets ?? EMPTY_FACETS;

  const nameOf = useMemo(() => {
    const map = new Map(members.map((m) => [m.userId, m.name]));
    return (userId: string) => map.get(userId) ?? "(不明)";
  }, [members]);

  const filteredEvents = useMemo((): EventInput[] => {
    const allSlots = members.flatMap((m) => m.availableSlots);
    if (allSlots.length === 0) return [];

    const allDates = allSlots.flatMap((s) => [new Date(s.start).getTime(), new Date(s.end).getTime()]);
    const minTime = Math.min(...allDates);
    const maxTime = Math.max(...allDates);
    const slotKey = (time: number) => Math.floor(time / SLOT_MS);

    interface SlotMembers {
      available: Set<string>;
      undecided: Set<string>;
      online: Set<string>;
    }
    const slotMap = new Map<number, SlotMembers>();
    for (const member of members) {
      for (const slot of member.availableSlots) {
        for (let t = new Date(slot.start).getTime(); t < new Date(slot.end).getTime(); t += SLOT_MS) {
          const key = slotKey(t);
          let bucket = slotMap.get(key);
          if (!bucket) {
            bucket = { available: new Set(), undecided: new Set(), online: new Set() };
            slotMap.set(key, bucket);
          }
          bucket[slot.type].add(member.userId);
        }
      }
    }

    const events: EventInput[] = [];
    for (let t = minTime; t < maxTime; t += SLOT_MS) {
      const start = new Date(t);
      const end = new Date(t + SLOT_MS);
      const bucket = slotMap.get(slotKey(t));
      const available = bucket ? [...bucket.available] : [];
      const undecided = bucket ? [...bucket.undecided] : [];
      const online = bucket ? [...bucket.online] : [];

      if (available.length < availableLimit) continue;

      const attending = new Set([...available, ...undecided, ...online]);
      const unavailable: string[] = [];
      const notInput: string[] = [];
      const slotDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      for (const member of members) {
        if (attending.has(member.userId)) continue;
        const last = member.lastInputDate ? new Date(member.lastInputDate) : null;
        const lastDay = last ? new Date(last.getFullYear(), last.getMonth(), last.getDate()) : null;
        if (lastDay && slotDay > lastDay) notInput.push(member.userId);
        else unavailable.push(member.userId);
      }

      const percentage = members.length > 0 ? available.length / members.length : 0;
      const green = Math.min(255, Math.round(180 * percentage)) + 75;
      const color = `rgb(80, ${green}, 150)`;

      events.push({
        start,
        end,
        title: `空:${available.length} 未:${undecided.length} オン:${online.length}`,
        backgroundColor: color,
        borderColor: color,
        extendedProps: {
          availableNames: available.map(nameOf),
          undecidedNames: undecided.map(nameOf),
          onlineNames: online.map(nameOf),
          unavailableNames: unavailable.map(nameOf),
          notInputNames: notInput.map(nameOf),
        },
      });
    }
    return events;
  }, [members, availableLimit, nameOf]);

  // --- フィルタ操作 ---
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

  const toggleGrade = (value: number, checked: boolean) =>
    setDraftGrades(checked ? [...draftGrades, value] : draftGrades.filter((v) => v !== value));
  const toggleName = (userId: string, checked: boolean) =>
    setDraftUserIds(checked ? [...draftUserIds, userId] : draftUserIds.filter((v) => v !== userId));

  const applyFilters = () =>
    setActiveFilter({
      groups: draftGroups.filter((g) => g.performanceId),
      grades: draftGrades,
      userIds: draftUserIds,
    });

  const clearAll = () => {
    setDraftGroups([]);
    setDraftGrades([]);
    setDraftUserIds([]);
    setActiveFilter(EMPTY_FILTER);
  };

  if (isLoading && !data) return <div className="text-center p-8">読み込み中...</div>;

  const canAddGroup = performanceOptions(-1).length > 0;

  // 選択中の公演（名簿表示用）
  const selectedPerformanceIds = new Set(draftGroups.map((g) => g.performanceId).filter(Boolean));
  const selectedPerformances = facets.performances.filter((p) => selectedPerformanceIds.has(p.id));

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* 左: フィルター */}
      <div className="md:w-1/3 space-y-4 p-4 border rounded-lg shadow-sm bg-white self-start">
        <div className="flex items-center justify-between border-b pb-2">
          <h2 className="text-xl font-semibold">フィルター</h2>
          <span className="text-sm text-gray-500">
            対象: {members.length}人{isFetching && <span className="ml-1 text-gray-400">更新中…</span>}
          </span>
        </div>

        <div>
          <p className="text-sm font-medium">✅ 「空き」が {availableLimit} 人以上</p>
          <input
            type="range"
            min={0}
            max={members.length}
            value={availableLimit}
            onChange={(e) => setAvailableLimit(Number(e.target.value))}
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

              <button type="button" onClick={() => removeGroup(i)} className="text-xs text-red-600">
                × このセットを削除
              </button>
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

      {/* 右: 結果カレンダー */}
      <div className="md:w-2/3 relative p-2 border rounded-lg bg-white shadow-sm" ref={calendarRef}>
        <FullCalendar
          plugins={[timeGridPlugin]}
          headerToolbar={{ left: "prev,next", center: "title", right: "timeGridWeek,timeGridDay" }}
          initialView="timeGridWeek"
          displayEventTime={false}
          locale={jaLocale}
          allDaySlot={false}
          slotMinTime="06:00:00"
          slotMaxTime="24:00:00"
          scrollTime="09:00:00"
          height="auto"
          events={filteredEvents}
          eventMouseEnter={(info) => {
            if (!calendarRef.current) return;
            const rect = calendarRef.current.getBoundingClientRect();
            const { availableNames, undecidedNames, onlineNames, unavailableNames, notInputNames } =
              info.event.extendedProps;
            setPopover({
              x: info.jsEvent.clientX - rect.left,
              y: info.jsEvent.clientY - rect.top,
              content: (
                <div className="text-xs">
                  <p>
                    <strong>✅ 空き ({availableNames.length}):</strong> {availableNames.join(", ") || "なし"}
                  </p>
                  <p>
                    <strong>⚠️ 未定 ({undecidedNames.length}):</strong> {undecidedNames.join(", ") || "なし"}
                  </p>
                  <p>
                    <strong>💻 オンライン ({onlineNames.length}):</strong> {onlineNames.join(", ") || "なし"}
                  </p>
                  <p>
                    <strong>❌ 不参加 ({unavailableNames.length}):</strong> {unavailableNames.join(", ") || "なし"}
                  </p>
                  <p>
                    <strong>❓ 未入力 ({notInputNames.length}):</strong> {notInputNames.join(", ") || "なし"}
                  </p>
                </div>
              ),
            });
          }}
          eventMouseLeave={() => setPopover(null)}
        />
        {popover && (
          <div
            className="absolute p-2 bg-gray-800 text-white border shadow-lg rounded-md z-10 pointer-events-none"
            style={{ left: popover.x + 15, top: popover.y + 15 }}
          >
            {popover.content}
          </div>
        )}
      </div>
    </div>
  );
}
