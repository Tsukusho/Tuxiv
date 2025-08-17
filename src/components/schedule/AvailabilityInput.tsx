'use client';

import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventInput } from '@fullcalendar/core';
import jaLocale from '@fullcalendar/core/locales/ja';

interface ScheduleEventData {
  title: string;
  description?: string;
  candidateDates: { start: string; end: string }[];
}

export default function AvailabilityInput({ eventId }: { eventId: string }) {
  const [eventData, setEventData] = useState<ScheduleEventData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [userName, setUserName] = useState('');
  const [grade, setGrade] = useState('');
  const [roles, setRoles] = useState('');
  
  const [isProfileSaved, setIsProfileSaved] = useState(false);

  const [myEvents, setMyEvents] = useState<EventInput[]>([]);
  const [inputType, setInputType] = useState<'available' | 'undecided'>('available');

  useEffect(() => {
    const fetchData = async () => {
      if (!eventId) return;
      setIsLoading(true);
      try {
        const res = await fetch(`/api/schedule/events/${eventId}`);
        if (!res.ok) throw new Error('データ取得に失敗');
        
        const { event, currentUser, currentUserAvailability } = await res.json();
        setEventData(event);

        if (currentUser) {
          setUserName(currentUser.fullName);
        }
        
        if (currentUserAvailability) {
          setGrade(currentUserAvailability.grade);
          setRoles(currentUserAvailability.roles.join(', '));
          
          const savedEvents = currentUserAvailability.availableSlots.map((slot: any) => ({
            title: slot.type === 'available' ? '空き' : '未定',
            start: slot.start,
            end: slot.end,
            backgroundColor: slot.type === 'available' ? '#3b82f6' : '#f59e0b',
            borderColor: slot.type === 'available' ? '#3b82f6' : '#f59e0b',
            extendedProps: { type: slot.type }
          }));
          setMyEvents(savedEvents);
        }
        
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [eventId]);

  const handleProfileSave = () => {
    if (!grade.trim()) {
      alert('学年(代)は必須です');
      return;
    }
    setIsProfileSaved(true);
  };

  const handleDateSelect = (selectInfo: any) => {
    if (!isProfileSaved) {
      alert('先に「プロフィールを保存して次に進む」ボタンを押してください。');
      return;
    }
    const calendarApi = selectInfo.view.calendar;
    calendarApi.unselect();
    const newEvent = {
      id: `${+new Date()}`,
      title: inputType === 'available' ? '空き' : '未定',
      start: selectInfo.startStr,
      end: selectInfo.endStr,
      backgroundColor: inputType === 'available' ? '#3b82f6' : '#f59e0b',
      borderColor: inputType === 'available' ? '#3b82f6' : '#f59e0b',
      extendedProps: { type: inputType }
    };
    calendarApi.addEvent(newEvent);
  };
  
  // ✨【変更】無限ループを防ぐための修正
  const handleEventsSet = (events: any) => {
    const plainEvents = events.map((e: any) => ({
        id: e.id,
        title: e.title,
        start: e.start,
        end: e.end,
        backgroundColor: e.backgroundColor,
        borderColor: e.borderColor,
        extendedProps: e.extendedProps,
    }));

    // 新しい予定と現在の予定を文字列で比較し、違いがある場合のみstateを更新する
    if (JSON.stringify(plainEvents) !== JSON.stringify(myEvents)) {
        setMyEvents(plainEvents);
    }
  };
  
  const handleAvailabilitySubmit = async () => {
    const name = userName; 
    if (myEvents.length === 0) {
      if (!confirm('空き時間を1つも選択していませんが、このまま「全て不参加」として登録しますか？')) {
        return;
      }
    }
    const availableSlots = myEvents.map(e => ({ 
        start: e.start, 
        end: e.end, 
        type: e.extendedProps?.type || 'available' 
    }));

    // 🔍 フロントエンドデバッグログ
    console.log('=== フロントエンド送信データ ===');
    console.log('myEvents:', myEvents);
    console.log('送信するavailableSlots:', availableSlots);
    console.log('================================');

    try {
        const response = await fetch(`/api/schedule/events/${eventId}/availabilities`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, grade, roles: roles.split(',').map(r => r.trim()), availableSlots })
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('API応答:', result);
            alert('予定を登録・更新しました！');
        } else {
            throw new Error('API応答エラー');
        }
    } catch (error) {
        console.error(error);
        alert('登録に失敗しました');
    }
  };

  if (isLoading) return <div className="text-center p-8">読み込み中...</div>;
  if (!eventData) return <div className="text-center p-8 text-red-500">イベントが見つかりません</div>;

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="md:w-72 md:flex-shrink-0 space-y-4 p-4 border rounded-lg shadow-sm bg-white self-start flex flex-col h-full">
        <div className="flex-grow">
            <h2 className="text-xl font-semibold border-b pb-2">1. プロフィール入力</h2>
            <p className="text-sm text-gray-600 mt-2">あなたの情報を入力してください。</p>
            <div className="mt-4 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">名前</label>
                    <input type="text" value={userName} readOnly className="mt-1 w-full rounded-md border-gray-300 shadow-sm bg-gray-100 cursor-not-allowed"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">学年(代) <span className="text-red-500">*</span></label>
                    <input 
                        type="number" 
                        placeholder="3 など半角数字のみ" 
                        value={grade} 
                        onChange={e => setGrade(e.target.value)}
                        disabled={isProfileSaved}
                        className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">役職 (コンマ区切り)</label>
                    <input 
                        type="text" 
                        placeholder="記録,役者 など半角コンマ区切り" 
                        value={roles} 
                        onChange={e => setRoles(e.target.value)}
                        disabled={isProfileSaved}
                        className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                    />
                </div>
                <button onClick={handleProfileSave} disabled={isProfileSaved} className="w-full bg-gray-700 text-white py-2 rounded-md hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
                  {isProfileSaved ? '✓ 保存済み' : 'プロフィールを保存して次に進む'}
                </button>
            </div>
        </div>
        
        <div className="mt-auto pt-4 border-t">
            <h2 className="text-xl font-semibold">2. 空き時間を入力</h2>
            <p className="text-sm text-gray-600 mb-4">カレンダーの空いている時間をドラッグして入力してください。</p>
            <button onClick={handleAvailabilitySubmit} className="w-full bg-indigo-600 text-white py-2.5 rounded-md text-lg font-semibold shadow-sm hover:bg-indigo-700">
                この内容で登録・更新する
            </button>
        </div>
      </div>

      <div className="flex-grow">
        <div className={`p-2 border rounded-lg bg-white shadow-sm ${!isProfileSaved ? 'opacity-40 cursor-not-allowed' : ''}`}>
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            headerToolbar={{
              left: 'prev,next',
              center: 'title',
              right: 'inputTypeToggle timeGridWeek,timeGridDay'
            }}
            customButtons={{
                inputTypeToggle: {
                    text: inputType === 'available' ? 'モード: 空き' : 'モード: 未定',
                    click: () => {
                        setInputType(current => current === 'available' ? 'undecided' : 'available');
                    }
                }
            }}
            initialView="timeGridWeek"
            locale={jaLocale}
            allDaySlot={false}
            height="calc(100vh - 120px)"
            slotMinTime="00:00:00"
            slotMaxTime="24:00:00"
            scrollTime="09:00:00"
            dayHeaderFormat={{ weekday: 'short', day: 'numeric' }}
            dayHeaderClassNames={(arg) => {
                if (arg.date.getDay() === 0) return ['fc-day-sun'];
                if (arg.date.getDay() === 6) return ['fc-day-sat'];
                return [];
            }}
            events={myEvents}
            selectable={isProfileSaved}
            selectMirror={true}
            editable={isProfileSaved}
            select={handleDateSelect}
            eventsSet={handleEventsSet}
            eventClick={ (clickInfo) => {
                if (!isProfileSaved) return;
                if(confirm(`この予定を削除しますか？`)){
                    clickInfo.event.remove()
                }
            }}
          />
        </div>
      </div>
    </div>
  );
}
