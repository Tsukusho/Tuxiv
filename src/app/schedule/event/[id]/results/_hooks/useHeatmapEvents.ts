"use client";

import type { EventInput } from "@fullcalendar/core";
import { useMemo } from "react";
import type { SearchMember } from "../_types/search";

const SLOT_MS = 30 * 60 * 1000;

interface SlotMembers {
  available: Set<string>;
  undecided: Set<string>;
  online: Set<string>;
}

export function useHeatmapEvents(
  members: SearchMember[],
  visibleRange: { start: number; end: number } | null,
  availableLimit: number,
): EventInput[] {
  const nameOf = useMemo(() => {
    const map = new Map(members.map((m) => [m.userId, m.name]));
    return (userId: string) => map.get(userId) ?? "(不明)";
  }, [members]);

  // 全期間ぶんのスロット集計 (members が変わった時だけ再計算する)。
  const slotMap = useMemo(() => {
    const map = new Map<number, SlotMembers>();
    for (const member of members) {
      for (const slot of member.availableSlots) {
        for (let t = new Date(slot.start).getTime(); t < new Date(slot.end).getTime(); t += SLOT_MS) {
          const key = Math.floor(t / SLOT_MS);
          let bucket = map.get(key);
          if (!bucket) {
            bucket = { available: new Set(), undecided: new Set(), online: new Set() };
            map.set(key, bucket);
          }
          bucket[slot.type].add(member.userId);
        }
      }
    }
    return map;
  }, [members]);

  return useMemo<EventInput[]>(() => {
    if (!visibleRange) return [];

    const events: EventInput[] = [];
    const from = Math.floor(visibleRange.start / SLOT_MS) * SLOT_MS;
    for (let t = from; t < visibleRange.end; t += SLOT_MS) {
      const start = new Date(t);
      const end = new Date(t + SLOT_MS);
      const bucket = slotMap.get(Math.floor(t / SLOT_MS));
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
  }, [slotMap, members, visibleRange, availableLimit, nameOf]);
}
