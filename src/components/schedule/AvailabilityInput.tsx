'use client';

// TODO: AvailabilityInputのリファクタ
// API、フォーム、カレンダーをそれぞれhook化,モバイル制御をutilsに切り出し

import { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventInput, EventApi } from '@fullcalendar/core';
import jaLocale from '@fullcalendar/core/locales/ja';
import UserCalendarEditor from './UserCalendarEditor';

interface ScheduleEventData {
  title: string;
  description?: string;
  candidateDates: { start: string; end: string }[];
}

interface AvailabilitySlot {
  start: string;
  end: string;
  type: 'available' | 'undecided' | 'online';
}

interface UserAvailability {
  grade: string;
  availableSlots: AvailabilitySlot[];
  lastInputDate?: string;
}

interface CurrentUser {
  fullName: string;
}

interface ApiResponse {
  event: ScheduleEventData;
  currentUser: CurrentUser;
  currentUserAvailability: UserAvailability;
}

interface DateSelectInfo {
  startStr: string;
  endStr: string;
  view: {
    calendar: {
      unselect: () => void;
      addEvent: (event: EventInput) => void;
    };
  };
}

interface EventClickInfo {
  event: {
    title: string;
    remove: () => void;
  };
}

export default function AvailabilityInput({ eventId }: { eventId: string }) {
  const [eventData, setEventData] = useState<ScheduleEventData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [userName, setUserName] = useState('');
  const [grade, setGrade] = useState('');

  const [isProfileSaved, setIsProfileSaved] = useState(false);

  const [myEvents, setMyEvents] = useState<EventInput[]>([]);
  const [inputType, setInputType] = useState<'available' | 'undecided' | 'online'>('available');
  const [lastInputDate, setLastInputDate] = useState<string>(''); // 予定入力最終日

  // タッチイベント制御用のstate
  const [isMobile, setIsMobile] = useState(false);
  const [isInputMode, setIsInputMode] = useState(false);
  const [firstTapTime, setFirstTapTime] = useState<string | null>(null);


  // モバイル判定
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // スマホ用の時間セル選択処理
  const handleTimeSlotClick = (dateInfo: { dateStr?: string; date?: Date }) => {
    if (!isMobile || !isInputMode || !isProfileSaved) return;

    const clickedTime = dateInfo.dateStr || dateInfo.date?.toISOString();
    if (!clickedTime) return;

    if (!firstTapTime) {
      // 1回目のタップ：開始時刻を記録
      setFirstTapTime(clickedTime);
    } else {
      // 2回目のタップ：予定を作成
      const start = new Date(firstTapTime);
      const end = new Date(clickedTime);
      
      // 開始時刻と終了時刻を正しい順序に調整
      const finalStart = start <= end ? start : end;
      const finalEnd = start <= end ? end : start;

      // 最小30分の予定にする
      if (finalEnd.getTime() - finalStart.getTime() < 30 * 60 * 1000) {
        finalEnd.setTime(finalStart.getTime() + 30 * 60 * 1000);
      }

      // 既存のhandleDateSelectを使用して予定を作成
      const selectInfo = {
        startStr: finalStart.toISOString(),
        endStr: finalEnd.toISOString(),
        view: {
          calendar: {
            unselect: () => {},
            addEvent: (event: EventInput) => {
              setMyEvents(prev => [...prev, event]);
            }
          }
        }
      };

      handleDateSelect(selectInfo);

      // 状態をリセット
      setFirstTapTime(null);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!eventId) return;
      setIsLoading(true);
      try {
        const res = await fetch(`/api/schedule/events/${eventId}`);
        if (!res.ok) throw new Error('データ取得に失敗');
        
        const { event, currentUser, currentUserAvailability }: ApiResponse = await res.json();
        setEventData(event);

        if (currentUser) {
          setUserName(currentUser.fullName);
        }
        
        if (currentUserAvailability) {
          setGrade(currentUserAvailability.grade);

          // 既存のlastInputDateがあれば設定、なければ空文字列
          if (currentUserAvailability.lastInputDate) {
            setLastInputDate(currentUserAvailability.lastInputDate.split('T')[0]);
          }
          
          const getEventStyle = (type: 'available' | 'undecided' | 'online') => {
            switch (type) {
              case 'available':
                return { title: '参加可能', backgroundColor: '#1976d2', borderColor: '#1565c0' };
              case 'undecided':
                return { title: '未定', backgroundColor: '#ffa726', borderColor: '#ff9800' };
              case 'online':
                return { title: 'オンライン可能', backgroundColor: '#4caf50', borderColor: '#388e3c' };
              default:
                return { title: '参加可能', backgroundColor: '#1976d2', borderColor: '#1565c0' };
            }
          };

          const savedEvents = currentUserAvailability.availableSlots.map((slot: AvailabilitySlot) => {
            const style = getEventStyle(slot.type);
            return {
              title: style.title,
              start: slot.start,
              end: slot.end,
              backgroundColor: style.backgroundColor,
              borderColor: style.borderColor,
              textColor: '#ffffff',
              extendedProps: { type: slot.type }
            };
          });
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

  const handleDateSelect = (selectInfo: DateSelectInfo) => {
    if (!isProfileSaved) {
      alert('先に「プロフィールを保存して次に進む」ボタンを押してください。');
      return;
    }
    const calendarApi = selectInfo.view.calendar;
    calendarApi.unselect();
    const getEventStyle = (type: 'available' | 'undecided' | 'online') => {
      switch (type) {
        case 'available':
          return { title: '参加可能', backgroundColor: '#1976d2', borderColor: '#1565c0' };
        case 'undecided':
          return { title: '未定', backgroundColor: '#ffa726', borderColor: '#ff9800' };
        case 'online':
          return { title: 'オンライン可能', backgroundColor: '#4caf50', borderColor: '#388e3c' };
        default:
          return { title: '参加可能', backgroundColor: '#1976d2', borderColor: '#1565c0' };
      }
    };
    const style = getEventStyle(inputType);
    const newEvent = {
      id: `${+new Date()}`,
      title: style.title,
      start: selectInfo.startStr,
      end: selectInfo.endStr,
      backgroundColor: style.backgroundColor,
      borderColor: style.borderColor,
      textColor: '#ffffff',
      extendedProps: { type: inputType }
    };
    calendarApi.addEvent(newEvent);
  };
  
  // 予定追加時にlastInputDateを自動更新する関数
  const updateLastInputDate = useCallback(() => {
    if (myEvents.length > 0) {
      try {
        // AvailabilitySlotから日付を取得（APIに送信する形式を使用）
        const availableSlots = myEvents.map(e => ({ 
          start: e.start, 
          end: e.end, 
          type: e.extendedProps?.type || 'available' 
        }));
        
        const allDates = availableSlots.flatMap(slot => [
          new Date(slot.start as string),
          new Date(slot.end as string)
        ]);
        
        if (allDates.length > 0) {
          const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
          const dateStr = maxDate.toISOString().split('T')[0];
          setLastInputDate(dateStr);
        }
      } catch (error) {
        console.warn('lastInputDate自動更新でエラー:', error);
      }
    }
  }, [myEvents]);

  // myEventsが変更された時にlastInputDateを更新
  useEffect(() => {
    updateLastInputDate();
  }, [updateLastInputDate]);

  const handleEventsSet = (events: EventApi[]) => {
    const plainEvents = events
      .filter((e: EventApi) => e.start && e.end) // nullをフィルタリング
      .map((e: EventApi) => ({
        id: e.id,
        title: e.title,
        start: e.start!,
        end: e.end!,
        backgroundColor: e.backgroundColor,
        borderColor: e.borderColor,
        textColor: e.textColor,
        extendedProps: e.extendedProps as { type?: 'available' | 'undecided' | 'online' },
      }));

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

    try {
        const response = await fetch(`/api/schedule/events/${eventId}/availabilities`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name,
              grade,
              availableSlots,
              lastInputDate: lastInputDate // 最終日情報を追加
            })
        });
        
        if (response.ok) {
            alert('予定を登録・更新しました！');
        } else {
            throw new Error('API応答エラー');
        }
    } catch (error) {
        console.error(error);
        alert('登録に失敗しました');
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-3 text-gray-600">読み込み中...</span>
    </div>
  );
  
  if (!eventData) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center text-red-500">
        <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p>イベントが見つかりません</p>
      </div>
    </div>
  );

  return (
    <div className="google-calendar-container">
      <style jsx>{`
        .google-calendar-container {
          min-height: 100vh;
          background: #f8f9fa;
          font-family: 'Google Sans', 'Roboto', sans-serif;
        }

        /* Google Calendar ライクなサイドバー */
        .gcal-sidebar {
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(60, 64, 67, 0.3), 0 4px 8px 3px rgba(60, 64, 67, 0.15);
          border: 1px solid #e8eaed;
          overflow: hidden;
        }

        .gcal-sidebar-header {
          padding: 24px 20px 16px 20px;
          border-bottom: 1px solid #e8eaed;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .gcal-profile-section {
          padding: 20px;
          border-bottom: 1px solid #e8eaed;
        }

        .gcal-form-group {
          margin-bottom: 16px;
        }

        .gcal-label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: #3c4043;
          margin-bottom: 6px;
        }

        .gcal-input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #dadce0;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.2s ease;
          background: #ffffff;
        }

        .gcal-input:focus {
          outline: none;
          border-color: #1a73e8;
          box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.2);
        }

        .gcal-input:disabled {
          background-color: #f8f9fa;
          color: #5f6368;
          cursor: not-allowed;
        }

        .gcal-btn {
          width: 100%;
          padding: 12px 24px;
          border-radius: 24px;
          border: none;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .gcal-btn-primary {
          background: #1a73e8;
          color: white;
        }

        .gcal-btn-primary:hover:not(:disabled) {
          background: #1557b2;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }

        .gcal-btn-primary:disabled {
          background: #5f6368;
          cursor: not-allowed;
        }

        .gcal-btn-success {
          background: #34a853;
          color: white;
        }

        .gcal-btn-success:hover {
          background: #2d8f47;
          box-shadow: 0 2px 8px rgba(52, 168, 83, 0.3);
        }

        .gcal-action-section {
          padding: 20px;
          background: #fafbfc;
        }

        /* Google Calendar ライクなカレンダー */
        .gcal-calendar-container {
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(60, 64, 67, 0.3), 0 4px 8px 3px rgba(60, 64, 67, 0.15);
          border: 1px solid #e8eaed;
          overflow: hidden;
        }

        .gcal-calendar-header {
          padding: 16px 20px;
          background: #ffffff;
          border-bottom: 1px solid #e8eaed;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .gcal-mode-toggle {
          background: #f1f3f4;
          color: #3c4043;
          border: none;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .gcal-mode-toggle:hover {
          background: #e8eaed;
        }

        .gcal-mode-toggle.available {
          background: #e3f2fd;
          color: #1976d2;
        }

        .gcal-mode-toggle.undecided {
          background: #fff3e0;
          color: #f57c00;
        }
        .gcal-mode-toggle.online {
          background: #e8f5e8;
          color: #388e3c;
        }

        /* メインレイアウト */
        .main-layout {
          display: flex;
          gap: 24px;
          padding: 24px;
          min-height: 100vh;
        }

        .sidebar-container {
          width: 320px;
          flex-shrink: 0;
        }

        .calendar-container {
          flex: 1;
          min-width: 0;
        }

        /* FullCalendar カスタマイズ */
        .gcal-calendar-container :global(.fc) {
          font-family: 'Google Sans', 'Roboto', sans-serif;
          font-size: 14px;
        }

        .gcal-calendar-container :global(.fc-toolbar) {
          padding: 0 20px 16px 20px;
          background: #ffffff;
        }

        .gcal-calendar-container :global(.fc-toolbar-title) {
          font-size: 22px;
          font-weight: 400;
          color: #3c4043;
        }

        .gcal-calendar-container :global(.fc-button) {
          background: #f8f9fa !important;
          border: 1px solid #dadce0 !important;
          color: #3c4043 !important;
          border-radius: 4px !important;
          font-weight: 500 !important;
          text-transform: none !important;
          box-shadow: none !important;
          height: 36px !important;
          padding: 0 16px !important;
        }

        .gcal-calendar-container :global(.fc-button:hover) {
          background: #f1f3f4 !important;
          border-color: #dadce0 !important;
        }

        .gcal-calendar-container :global(.fc-button-active) {
          background: #1a73e8 !important;
          border-color: #1a73e8 !important;
          color: white !important;
        }

        .gcal-calendar-container :global(.fc-daygrid-day) {
          border-color: #e8eaed;
        }

        .gcal-calendar-container :global(.fc-timegrid-slot) {
          border-color: #e8eaed;
          height: 20px;
        }

        .gcal-calendar-container :global(.fc-col-header-cell) {
          background: #f8f9fa;
          border-color: #e8eaed;
          font-weight: 500;
          color: #5f6368;
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 0.8px;
        }

        .gcal-calendar-container :global(.fc-event) {
          border-radius: 4px !important;
          border: none !important;
          font-size: 12px !important;
          font-weight: 500 !important;
          padding: 2px 6px !important;
          cursor: pointer !important;
        }

        .gcal-calendar-container :global(.fc-event:hover) {
          opacity: 0.8;
        }

        .gcal-calendar-container :global(.fc-day-today) {
          background-color: rgba(26, 115, 232, 0.04) !important;
        }

        .gcal-calendar-container :global(.fc-day-sun .fc-col-header-cell-cushion) {
          color: #d93025;
        }

        .gcal-calendar-container :global(.fc-day-sat .fc-col-header-cell-cushion) {
          color: #1a73e8;
        }

        /* 無効化時のオーバーレイ */
        .gcal-disabled-overlay {
          position: relative;
        }

        .gcal-disabled-overlay::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.7);
          z-index: 10;
          pointer-events: none;
          border-radius: 12px;
        }

        .gcal-disabled-overlay.disabled::before {
          display: block;
        }

        .gcal-disabled-overlay:not(.disabled)::before {
          display: none;
        }

        /* モバイル対応 */
        @media (max-width: 768px) {
          .main-layout {
            flex-direction: column;
            padding: 16px;
            gap: 16px;
          }

          .sidebar-container {
            width: 100%;
            order: 1;
          }

          .calendar-container {
            width: 100%;
            order: 2;
          }

          .gcal-calendar-container {
            margin: 0 -16px;
            border-radius: 0;
            border-left: none;
            border-right: none;
          }

          .gcal-calendar-container :global(.fc-toolbar) {
            padding: 12px 16px;
            flex-wrap: wrap;
            gap: 8px;
          }

          .gcal-calendar-container :global(.fc-toolbar-title) {
            font-size: 18px;
            order: 1;
            width: 100%;
            text-align: center;
            margin-bottom: 8px;
          }

          .gcal-calendar-container :global(.fc-toolbar-chunk) {
            display: flex;
            justify-content: center;
          }

          .gcal-calendar-header {
            padding: 12px 16px;
            flex-wrap: wrap;
            gap: 8px;
          }

          .gcal-calendar-header h3 {
            font-size: 16px;
            margin: 0;
          }

          .gcal-mode-toggle {
            padding: 6px 12px;
            font-size: 12px;
          }

          /* モバイル用カレンダー設定 */
          .mobile-calendar-wrapper {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            /* タッチアクション制御 */
            touch-action: manipulation;
          }

          /* カレンダー内のタッチエリア制御 */
          .mobile-calendar-wrapper :global(.fc-view-harness) {
            touch-action: none; /* 一本指ではスクロール無効 */
            min-width: 480px;
          }

          /* スマホ版：カレンダーの縦幅を1.5倍に拡張 */
          .mobile-calendar-wrapper :global(.fc) {
            height: calc(150vh - 420px) !important; /* 1.5倍に拡張 */
          }

          .gcal-calendar-container :global(.fc-timegrid-slot) {
            height: 30px; /* デフォルトの1.5倍 (20px → 30px) */
          }

          .gcal-calendar-container :global(.fc-timegrid-slot-label) {
            font-size: 12px; /* 読みやすいサイズ */
            line-height: 30px; /* スロット高さに合わせる */
          }

          .gcal-calendar-container :global(.fc-col-header-cell) {
            font-size: 12px;
            padding: 8px 4px; /* より大きなタップエリア */
            height: 40px; /* ヘッダーも拡張 */
          }

          .gcal-calendar-container :global(.fc-event) {
            font-size: 11px !important;
            padding: 3px 6px !important; /* より大きなタップエリア */
            min-height: 20px !important; /* 最小高さを設定 */
          }

          /* 入力モード時のカレンダー強調 */
          .mobile-calendar-wrapper.input-mode {
            border: 2px solid #34a853;
            box-shadow: 0 0 0 4px rgba(52, 168, 83, 0.1);
          }

          .mobile-calendar-wrapper.input-mode :global(.fc-timegrid-slot) {
            cursor: pointer;
            transition: background-color 0.2s ease;
          }

          /* 入力モード時のホバー効果もより大きく */
          .mobile-calendar-wrapper.input-mode :global(.fc-timegrid-slot:hover) {
            background-color: rgba(52, 168, 83, 0.15) !important;
          }

          /* 1回目タップ後の状態 */
          .mobile-calendar-wrapper.awaiting-second-tap {
            border-color: #ff9800;
            box-shadow: 0 0 0 4px rgba(255, 152, 0, 0.1);
          }

          .gcal-sidebar {
            border-radius: 8px;
          }

          .gcal-profile-section {
            padding: 16px;
          }

          .gcal-action-section {
            padding: 16px;
          }

          /* モバイル用ヒント表示 */
          .mobile-hint {
            background: #e3f2fd;
            border: 1px solid #1976d2;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 16px;
            font-size: 12px;
            color: #1565c0;
          }

          .mobile-hint .hint-icon {
            display: inline-block;
            margin-right: 6px;
            font-weight: bold;
          }

          /* 入力モード切り替えボタン */
          .mobile-input-toggle {
            margin-bottom: 16px;
          }

          .input-mode-btn {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #dadce0;
            border-radius: 12px;
            background: #ffffff;
            color: #5f6368;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
          }

          .input-mode-btn:hover:not(:disabled) {
            border-color: #1a73e8;
            background: #f8f9fa;
          }

          .input-mode-btn.active {
            border-color: #34a853;
            background: #e8f5e8;
            color: #2d8f47;
            animation: pulse 2s infinite;
          }

          .input-mode-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .input-mode-icon {
            font-size: 16px;
          }

          /* パルスアニメーション */
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.02); }
            100% { transform: scale(1); }
          }

          .gcal-form-group {
            margin-bottom: 12px;
          }

          .gcal-input {
            padding: 10px 12px;
            font-size: 16px; /* iOS zoom対策 */
          }

          .gcal-btn {
            padding: 10px 20px;
            font-size: 14px;
          }
        }

        @media (max-width: 480px) {
          .main-layout {
            padding: 12px;
          }

          .gcal-calendar-container {
            margin: 0 -12px;
          }

          .gcal-calendar-container :global(.fc-view-harness) {
            min-width: 400px;
          }

          .gcal-calendar-container :global(.fc-toolbar) {
            padding: 8px 12px;
          }

          .gcal-calendar-header {
            padding: 8px 12px;
          }
        }
      `}</style>

      <div className="main-layout">
        {/* Google Calendar ライクなサイドバー */}
        <div className="sidebar-container">
          <div className="gcal-sidebar">
            
            <div className="gcal-profile-section">
              <h3 className="text-lg font-medium text-gray-900 mb-4">プロフィール情報</h3>
              
              <div className="gcal-form-group">
                <label className="gcal-label">お名前</label>
                <input 
                  type="text" 
                  value={userName} 
                  readOnly 
                  className="gcal-input"
                  style={{ background: '#f8f9fa', cursor: 'not-allowed' }}
                />
              </div>
              
              <div className="gcal-form-group">
                <label className="gcal-label">
                  学年(代) <span style={{ color: '#d93025' }}>*</span>
                </label>
                <input 
                  type="number" 
                  placeholder="3" 
                  value={grade} 
                  onChange={e => setGrade(e.target.value)}
                  disabled={isProfileSaved}
                  className="gcal-input"
                />
              </div>
              
              <div className="gcal-form-group">
                <UserCalendarEditor />
              </div>

              <button
                onClick={handleProfileSave} 
                disabled={isProfileSaved} 
                className={`gcal-btn ${isProfileSaved ? 'gcal-btn-primary' : 'gcal-btn-primary'}`}
              >
                {isProfileSaved ? (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    保存済み
                  </>
                ) : (
                  '次のステップへ進む'
                )}
              </button>
            </div>
            
            <div className="gcal-action-section">
              <h3 className="text-lg font-medium text-gray-900 mb-3">空き時間の入力</h3>
              
              {/* スマホ版ヒント */}
              {isMobile && (
                <div className="mobile-hint">
                  <div className="hint-icon">💡</div>
                  <strong>スマホでの操作方法：</strong><br />
                  {isInputMode ? (
                    <>
                      • 1回目タップ：開始時刻を選択<br />
                      • 2回目タップ：終了時刻を選択し予定を作成<br />
                      {firstTapTime && <span style={{color: '#d93025'}}>• 次のタップで終了時刻を選択してください</span>}
                    </>
                  ) : (
                    '• 入力モードをONにして時刻を選択してください'
                  )}
                </div>
              )}

              {/* スマホ版入力モード切り替えボタン */}
              {isMobile && (
                <div className="mobile-input-toggle">
                  <button 
                    onClick={() => {
                      setIsInputMode(!isInputMode);
                      setFirstTapTime(null);
                    }}
                    className={`input-mode-btn ${isInputMode ? 'active' : ''}`}
                    disabled={!isProfileSaved}
                  >
                    <span className="input-mode-icon">
                      {isInputMode ? '📍' : '⏰'}
                    </span>
                    {isInputMode ? '入力モード ON' : '入力モード OFF'}
                  </button>
                </div>
              )}
              
              <p className="text-sm text-gray-600 mb-4">
                {isMobile 
                  ? 'カレンダーで参加可能な時間を指でタップ&ドラッグして選択してください。'
                  : 'カレンダーで参加可能な時間をドラッグして選択してください。'
                }
              </p>
              
              {/* 最終日選択UI */}
              <div className="gcal-form-group mb-4">
                <label className="gcal-label">
                  予定入力最終日 <span className="text-xs text-gray-500">(この日まで入力したことを記録)</span>
                </label>
                <input 
                  type="date" 
                  value={lastInputDate} 
                  onChange={e => setLastInputDate(e.target.value)}
                  className="gcal-input"
                  style={{ 
                    fontSize: '16px', // モバイル対応
                    background: '#f8f9fa',
                    border: '2px solid #e8eaed',
                    borderRadius: '8px',
                    padding: '12px 16px'
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  予定を入力した最後の日付を選択してください。この日以降は「未入力」として結果に表示されます。
                </p>
              </div>
              
              <button 
                onClick={handleAvailabilitySubmit} 
                className="gcal-btn gcal-btn-success"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                登録・更新する
              </button>
            </div>
          </div>
        </div>

        {/* Google Calendar ライクなカレンダー */}
        <div className="calendar-container">
          <div className={`gcal-calendar-container gcal-disabled-overlay ${!isProfileSaved ? 'disabled' : ''}`}>
            <div className="gcal-calendar-header">
              <h3 className="text-lg font-medium text-gray-900">カレンダー</h3>
              <button 
                onClick={() => setInputType(current => current === 'available' ? 'undecided' : current === 'undecided' ? 'online' : 'available')}
                className={`gcal-mode-toggle ${inputType}`}
              >
                {inputType === 'available' ? '参加可能モード' : inputType === 'undecided' ? '未定モード' : 'オンラインモード'}
              </button>
            </div>
            
            <div className={`mobile-calendar-wrapper ${
              isMobile && isInputMode ? 'input-mode' : ''
            } ${
              isMobile && firstTapTime ? 'awaiting-second-tap' : ''
            }`}>
              <div className="p-4">
                <FullCalendar
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'timeGridWeek,timeGridDay'
                  }}
                  initialView="timeGridWeek"
                  locale={jaLocale}
                  allDaySlot={false}
                  height="calc(100vh - 280px)"
                  slotMinTime="06:00:00"
                  slotMaxTime="24:00:00"
                  scrollTime="09:00:00"
                  slotDuration="00:30:00"
                  slotLabelInterval="01:00:00"
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
                  eventClick={(clickInfo: EventClickInfo) => {
                    if (!isProfileSaved) return;
                    if(confirm(`この予定「${clickInfo.event.title}」を削除しますか？`)){
                      clickInfo.event.remove()
                    }
                  }}
                  nowIndicator={true}
                  slotLabelFormat={{
                    hour: 'numeric',
                    minute: '2-digit',
                    meridiem: false
                  }}
                  dateClick={handleTimeSlotClick}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
