'use client';

import { useState } from 'react';

export default function TagEditor({ artworkId, initialTags }: { artworkId: string; initialTags: string[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState(initialTags.join(', '));
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    setSaving(true);
    const tags = input.split(',').map(t => t.trim()).filter(Boolean);
    try {
      const res = await fetch(`/api/artworks/${artworkId}/tags`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tags }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'タグの更新に失敗しました');
      }
      // 成功時は再読み込み
      window.location.reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'エラーが発生しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
      >
        {isOpen ? '編集を閉じる' : 'タグを編集'}
      </button>

      {isOpen && (
        <div className="space-y-2">
          <input
            className="input-field w-full"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="カンマ区切りで入力 (例: 風景, 夜空)"
          />
          <button className="btn-primary" onClick={onSave} disabled={saving}>
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      )}
    </div>
  );
}


