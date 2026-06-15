"use client";

import jaLocale from "@fullcalendar/core/locales/ja";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import { type ReactNode, useRef, useState } from "react";
import { useHeatmapEvents } from "../_hooks/useHeatmapEvents";
import type { SearchMember } from "../_types/search";

export default function HeatmapCalendar({
  members,
  availableLimit,
}: {
  members: SearchMember[];
  availableLimit: number;
}) {
  const [visibleRange, setVisibleRange] = useState<{ start: number; end: number } | null>(null);
  const [popover, setPopover] = useState<{ content: ReactNode; x: number; y: number } | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  const events = useHeatmapEvents(members, visibleRange, availableLimit);

  return (
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
        events={events}
        datesSet={(arg) => setVisibleRange({ start: arg.start.getTime(), end: arg.end.getTime() })}
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
  );
}
