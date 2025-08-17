'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ScheduleCreationForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  // 候補日を複数管理するためのstate
  const [candidateDates, setCandidateDates] = useState([{ start: '', end: '' }]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleAddDate = () => {
    setCandidateDates([...candidateDates, { start: '', end: '' }]);
  };

  const handleDateChange = (index: number, field: 'start' | 'end', value: string) => {
    const newDates = [...candidateDates];
    newDates[index][field] = value;
    setCandidateDates(newDates);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    if (!title || candidateDates.some(d => !d.start || !d.end)) {
      setError('タイトルと全ての候補日時を入力してください。');
      setIsSubmitting(false);
      return;
    }
    
    try {
      const response = await fetch('/api/schedule/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, candidateDates }),
      });

      if (!response.ok) {
        throw new Error('イベント作成に失敗しました');
      }

      const newEvent = await response.json();
      // イベント作成後、そのイベントの出欠入力ページにリダイレクト
      router.push(`/schedule/event/${newEvent._id}`);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">タイトル</label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">説明（任意）</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">候補日時</label>
        {candidateDates.map((date, index) => (
          <div key={index} className="flex items-center space-x-2 mt-2">
            <input
              type="datetime-local"
              value={date.start}
              onChange={(e) => handleDateChange(index, 'start', e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
              required
            />
            <span>〜</span>
            <input
              type="datetime-local"
              value={date.end}
              onChange={(e) => handleDateChange(index, 'end', e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
              required
            />
          </div>
        ))}
        <button type="button" onClick={handleAddDate} className="mt-2 text-sm text-indigo-600 hover:text-indigo-800">
          + 候補日を追加
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isSubmitting ? '作成中...' : 'イベントを作成'}
        </button>
      </div>
    </form>
  );
}