'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

type Props = {
  isLoggedIn: boolean;
};

type Me = {
  studentId?: string | null;
};

async function fetchMe(): Promise<Me> {
  const res = await fetch('/api/users/me', { credentials: 'include' });
  if (!res.ok) throw new Error('failed to fetch me');
  return res.json();
}

async function patchStudentId(studentId: string) {
  const res = await fetch('/api/profile/me/studentId', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId }),
    credentials: 'include',
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || '登録に失敗しました。');
  }
  return res.json();
}

export default function StudentIdGate({ isLoggedIn }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [studentId, setStudentId] = useState('');

  const { data } = useQuery({
    queryKey: ['me'],
    queryFn: fetchMe,
    enabled: isLoggedIn,
  });

  const mutation = useMutation({
    mutationFn: patchStudentId,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      router.refresh();
    },
  });

  const hasStudentId = !!data?.studentId;

  if (!isLoggedIn || !data || hasStudentId) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md card p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">学籍番号を登録してください</h2>
          <p className="text-gray-600 text-sm mt-2">
            ログインに必要なため、学籍番号の登録をお願いします
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate(studentId);
          }}
          className="space-y-6"
        >
          <div>
            <label htmlFor="gateStudentId" className="block text-sm font-semibold text-gray-700 mb-2">
              学籍番号 <span className="text-red-500">*</span>
            </label>
            <input
              id="gateStudentId"
              type="text"
              inputMode="numeric"
              pattern="\d{9}"
              maxLength={9}
              value={studentId}
              onChange={(e) => setStudentId(e.target.value.replace(/\D/g, ''))}
              required
              className="input-field w-full"
              placeholder="例: 202312345"
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">
              s以降の20**~から始まる9桁の数字を入力してください。ログイン時に使用します。
            </p>
            <p className="text-xs text-gray-500 mt-1">
              卒業生の場合も、在学時の学籍番号の記入をお願いします。
            </p>
          </div>

          {mutation.isError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm font-medium">{mutation.error.message}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={mutation.isPending}
            className="btn-primary w-full py-3 text-base disabled:opacity-50"
          >
            {mutation.isPending ? '登録中...' : '登録'}
          </button>
        </form>
      </div>
    </div>
  );
}
