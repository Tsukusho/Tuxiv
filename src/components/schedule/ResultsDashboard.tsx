'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { EventInput } from '@fullcalendar/core';
import jaLocale from '@fullcalendar/core/locales/ja';

// APIから受け取るデータの型定義
interface AvailabilityData {
    _id: string;
    name: string;
    grade: string;
    roles: string[];
    availableSlots: { 
      start: string; 
      end: string; 
      type: 'available' | 'undecided'; 
    }[];
  }

interface EventData {
  title: string;
  candidateDates: { start: string; end: string }[];
}

export default function ResultsDashboard({ eventId }: { eventId: string }) {
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [allAvailabilities, setAllAvailabilities] = useState<AvailabilityData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // フィルター用のstate
  const [availableLimit, setAvailableLimit] = useState(1); 
  const [draftSelectedRoles, setDraftSelectedRoles] = useState<string[]>([]);
  const [draftSelectedGrades, setDraftSelectedGrades] = useState<string[]>([]);
  const [draftSelectedNames, setDraftSelectedNames] = useState<string[]>([]);
  const [activeSelectedRoles, setActiveSelectedRoles] = useState<string[]>([]);
  const [activeSelectedGrades, setActiveSelectedGrades] = useState<string[]>([]);
  const [activeSelectedNames, setActiveSelectedNames] = useState<string[]>([]);

  const [popoverContent, setPopoverContent] = useState<{ content: React.ReactNode; x: number; y: number } | null>(null);
  const calendarContainerRef = useRef<HTMLDivElement>(null);

  // APIからイベントと全出欠情報を取得
  useEffect(() => {
    const fetchData = async () => {
      if (!eventId) return;
      setIsLoading(true);
      try {
        const res = await fetch(`/api/schedule/events/${eventId}`);
        if (!res.ok) throw new Error('データ取得失敗');
        const data = await res.json();
        
        // データの構造を確認し、安全に設定
        if (data.event) {
          setEventData(data.event);
        }
        
        // availabilitiesが配列であることを確認
        if (Array.isArray(data.availabilities)) {
          setAllAvailabilities(data.availabilities);
        } else {
          console.warn('availabilitiesが配列ではありません:', data.availabilities);
          setAllAvailabilities([]);
        }
      } catch (error) {
        console.error('データ取得エラー:', error);
        // エラー時は空の配列を設定
        setAllAvailabilities([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [eventId]);

  const roleCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    // allAvailabilitiesが配列でない場合の安全な処理
    if (!Array.isArray(allAvailabilities)) {
      return counts;
    }
    for (const availability of allAvailabilities) {
      for (const role of availability.roles) {
        counts[role] = (counts[role] || 0) + 1;
      }
    }
    return counts;
  }, [allAvailabilities]);

  const gradeCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    // allAvailabilitiesが配列でない場合の安全な処理
    if (!Array.isArray(allAvailabilities)) {
      return counts;
    }
    for (const availability of allAvailabilities) {
      const grade = availability.grade;
      counts[grade] = (counts[grade] || 0) + 1;
    }
    return counts;
  }, [allAvailabilities]);

  const filteredEvents = useMemo((): EventInput[] => {
    if (!eventData) return [];
    
    // allAvailabilitiesが配列でない場合の安全な処理
    if (!Array.isArray(allAvailabilities)) {
      return [];
    }

    const targetMembers = allAvailabilities.filter(a =>
      (activeSelectedRoles.length === 0 || a.roles.some(r => activeSelectedRoles.includes(r))) &&
      (activeSelectedGrades.length === 0 || activeSelectedGrades.includes(a.grade)) &&
      (activeSelectedNames.length === 0 || activeSelectedNames.includes(a.name))
    );

    if (targetMembers.length === 0 && (draftSelectedRoles.length > 0 || draftSelectedGrades.length > 0 || draftSelectedNames.length > 0)) {
        return [];
    }
    
    // availabilitiesデータから実際の日時範囲を取得
    const allSlots = targetMembers.flatMap(member => member.availableSlots);
    
    if (allSlots.length === 0) {
        return []; // availableSlotsがない場合は空を返す
    }
    
    // 最小・最大日時を取得
    const allDates = allSlots.flatMap(slot => [new Date(slot.start), new Date(slot.end)]);
    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
    
    // 30分刻みでスロットを生成
    const slots = [];
    let current = new Date(minDate);
    while (current < maxDate) {
        const next = new Date(current.getTime() + 30 * 60 * 1000);
        slots.push({ start: new Date(current), end: new Date(next) });
        current = next;
    }

    const allSlotEvents = slots.map(slot => {
      const availableMembers: string[] = [];
      const undecidedMembers: string[] = [];
      const onlineMembers: string[] = [];
      
      for (const member of targetMembers) {
        const foundSlot = member.availableSlots.find(avail => {
          const availStart = new Date(avail.start);
          const availEnd = new Date(avail.end);
          // 時間の重複チェック: スロットが重複している場合に一致とする
          return availStart < slot.end && availEnd > slot.start;
        });

        if (foundSlot?.type === 'undecided') {
            undecidedMembers.push(member.name);
        } else if (foundSlot?.type === 'online') {
            onlineMembers.push(member.name);
        } else if (foundSlot) {
            availableMembers.push(member.name);
        }
      }

      const targetMemberNames = targetMembers.map(m => m.name);
      const unavailableMembers = targetMemberNames.filter(
        name => !availableMembers.includes(name) && !undecidedMembers.includes(name)
      );
      
      const totalTargetMembers = targetMembers.length || allAvailabilities.length;
      const percentage = totalTargetMembers > 0 ? (availableMembers.length / totalTargetMembers) : 0;
      const green = Math.min(255, Math.round(180 * percentage));
      const color = `rgb(80, ${green + 75}, 150)`;


      return {
        start: slot.start,
        end: slot.end,
        title: `空:${availableMembers.length} 未:${undecidedMembers.length} オン:${onlineMembers.length}`,
        backgroundColor: color,
        borderColor: color,
        extendedProps: {
          availableNames: availableMembers,
          undecidedNames: undecidedMembers,
          onlineNames: onlineMembers,
          unavailableNames: unavailableMembers,
        }
      };
    });

    return allSlotEvents.filter(event => event.extendedProps.availableNames.length >= availableLimit);
  }, [eventData, allAvailabilities, availableLimit, activeSelectedRoles, activeSelectedGrades, activeSelectedNames, draftSelectedRoles.length, draftSelectedGrades.length, draftSelectedNames.length]);
  
  const allRoles = useMemo(() => {
    if (!Array.isArray(allAvailabilities)) {
      return [];
    }
    return [...new Set(allAvailabilities.flatMap(a => a.roles))];
  }, [allAvailabilities]);
  
  const allGrades = useMemo(() => {
    if (!Array.isArray(allAvailabilities)) {
      return [];
    }
    return [...new Set(allAvailabilities.map(a => a.grade))];
  }, [allAvailabilities]);

  const allNames = useMemo(() => {
    if (!Array.isArray(allAvailabilities)) {
      return [];
    }
    return [...new Set(allAvailabilities.map(a => a.name))].sort();
  }, [allAvailabilities]);

  const handleApplyFilters = () => {
    setActiveSelectedRoles(draftSelectedRoles);
    setActiveSelectedGrades(draftSelectedGrades);
    setActiveSelectedNames(draftSelectedNames);
  };

  const handleSelectAllNames = () => {
    setDraftSelectedNames(allNames);
  };

  const handleDeselectAllNames = () => {
    setDraftSelectedNames([]);
  };

  if (isLoading) return <div className="text-center p-8">読み込み中...</div>;
  if (!eventData) return <div className="text-center p-8 text-red-500">イベントが見つかりません</div>;


  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* 左側: フィルター */}
      <div className="md:w-1/3 space-y-4 p-4 border rounded-lg shadow-sm bg-white self-start">
        <h2 className="text-xl font-semibold border-b pb-2">フィルター</h2>
        <div>
          <label className="block text-sm font-medium">✅ 「空き」が {availableLimit} 人以上</label>
          <input type="range" min="0" max={Array.isArray(allAvailabilities) ? allAvailabilities.length : 0} value={availableLimit} onChange={e => setAvailableLimit(Number(e.target.value))} className="w-full"/>
        </div>
        
        <div>
          <label className="block text-sm font-medium">役職で絞り込み</label>
           {allRoles.map(role => (
            <div key={role} className="flex items-center justify-between">
              <div>
                <input 
                  type="checkbox" 
                  id={role} 
                  value={role} 
                  onChange={e => {
                    setDraftSelectedRoles(e.target.checked ? [...draftSelectedRoles, role] : draftSelectedRoles.filter(r => r !== role));
                  }} 
                  className="mr-2"
                />
                <label htmlFor={role}>{role}</label>
              </div>
            <span className="text-sm text-gray-500">{roleCounts[role] || 0}人</span>
            </div>
           ))}
        </div>

        <div>
          <label className="block text-sm font-medium">学年で絞り込み</label>
           {allGrades.map(grade => (
            <div key={grade} className="flex items-center justify-between">
              <div>
                <input 
                  type="checkbox" 
                  id={grade} 
                  value={grade}
                  onChange={e => {
                      setDraftSelectedGrades(e.target.checked ? [...draftSelectedGrades, grade] : draftSelectedGrades.filter(g => g !== grade));
                  }} 
                  className="mr-2"
                />
                <label htmlFor={grade}>{grade}</label>
              </div>
              <span className="text-sm text-gray-500">{gradeCounts[grade] || 0}人</span>
            </div>
           ))}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium">名前で絞り込み</label>
            <div className="space-x-2">
              <button 
                onClick={handleSelectAllNames}
                className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
              >
                全選択
              </button>
              <button 
                onClick={handleDeselectAllNames}
                className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
              >
                全解除
              </button>
            </div>
          </div>
          {allNames.map(name => (
            <div key={name} className="flex items-center">
              <input 
                type="checkbox" 
                id={name} 
                value={name}
                checked={draftSelectedNames.includes(name)}
                onChange={e => {
                  setDraftSelectedNames(e.target.checked ? [...draftSelectedNames, name] : draftSelectedNames.filter(n => n !== name));
                }} 
                className="mr-2"
              />
              <label htmlFor={name}>{name}</label>
            </div>
          ))}
        </div>
        <div className="pt-4 border-t">
            <button 
                onClick={handleApplyFilters}
                className="w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
            >
                この条件でフィルターを適用
            </button>
        </div>
      </div>

      {/* 右側: 結果カレンダー */}
      <div className="md:w-2/3 relative p-2 border rounded-lg bg-white shadow-sm" ref={calendarContainerRef}>
        <FullCalendar
          plugins={[timeGridPlugin]}
          headerToolbar={{ left: 'prev,next', center: 'title', right: 'timeGridWeek,timeGridDay' }}
          initialView="timeGridWeek"
          displayEventTime={false}
          locale={jaLocale}
          allDaySlot={false}
          height="auto"
          events={filteredEvents}
          eventMouseEnter={(info) => {
            if (!calendarContainerRef.current) return;
            const containerRect = calendarContainerRef.current.getBoundingClientRect();
            const x = info.jsEvent.clientX - containerRect.left;
            const y = info.jsEvent.clientY - containerRect.top;
            
            // デバッグ用にconsole.logを残しておきます
            console.log("Hover position:", { x, y });

            const { availableNames, undecidedNames, onlineNames, unavailableNames } = info.event.extendedProps;
            const content = (
              <div className="text-xs">
                <p><strong>✅ 空き ({availableNames.length}):</strong> {availableNames.join(', ') || 'なし'}</p>
                <p><strong>⚠️ 未定 ({undecidedNames.length}):</strong> {undecidedNames.join(', ') || 'なし'}</p>
                <p><strong>💻 オンライン ({onlineNames.length}):</strong> {onlineNames.join(', ') || 'なし'}</p>
                <p><strong>❌ 不参加 ({unavailableNames.length}):</strong> {unavailableNames.join(', ') || 'なし'}</p>
              </div>
            );
            setPopoverContent({ content, x, y });
          }}
          eventMouseLeave={() => {
            setPopoverContent(null);
          }}
        />
        {popoverContent && (
          <div 
            className="absolute p-2 bg-gray-800 text-white border shadow-lg rounded-md z-10 pointer-events-none"
            style={{ left: popoverContent.x + 15, top: popoverContent.y + 15 }}
          >
            {popoverContent.content}
          </div>
        )}
      </div>
    </div>
  );
}