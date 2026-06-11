"use client";

import { useState } from "react";
import { apiErrorMessage } from "@/lib/fetchClient";
import { useAdminUsers } from "../_hooks/useAdminUsers";

// 卒業フラグの付与/解除 (表示層)。卒業者は日程調整の検索結果から除外される。
export default function GraduationEditor() {
  const { users, isLoading, setGraduation, isSaving } = useAdminUsers();
  const [selectedId, setSelectedId] = useState("");

  const active = users.filter((u) => !u.isGraduated);
  const graduated = users.filter((u) => u.isGraduated);

  const handleMark = () => {
    if (!selectedId) return;
    setGraduation.mutate(
      { id: selectedId, isGraduated: true },
      {
        onSuccess: () => setSelectedId(""),
        onError: (error) => alert(apiErrorMessage(error, "更新に失敗しました")),
      },
    );
  };

  const handleUnmark = (id: string) => {
    setGraduation.mutate(
      { id, isGraduated: false },
      { onError: (error) => alert(apiErrorMessage(error, "更新に失敗しました")) },
    );
  };

  return (
    <div className="grad-editor">
      <h2 className="title">卒業フラグ（検索から除外）</h2>

      {isLoading ? (
        <p className="muted">読み込み中...</p>
      ) : (
        <>
          <div className="add-row">
            <select
              className="select"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              disabled={isSaving}
            >
              <option value="">ユーザーを選択...</option>
              {active.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.fullName}（{u.username}）
                </option>
              ))}
            </select>
            <button type="button" className="btn primary" disabled={isSaving || !selectedId} onClick={handleMark}>
              卒業にする
            </button>
          </div>

          <div className="graduated">
            <p className="section-label">卒業フラグ中（{graduated.length}人）</p>
            {graduated.length === 0 ? (
              <p className="muted">なし</p>
            ) : (
              <ul className="list">
                {graduated.map((u) => (
                  <li key={u._id} className="row">
                    <span className="name">
                      {u.fullName}
                      <span className="sub">（{u.username}）</span>
                    </span>
                    <button type="button" className="btn" disabled={isSaving} onClick={() => handleUnmark(u._id)}>
                      解除
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      <style jsx>{`
        .grad-editor {
          background: #ffffff;
          border: 1px solid #e8eaed;
          border-radius: 8px;
          padding: 16px;
        }
        .title {
          font-size: 16px;
          font-weight: 600;
          color: #3c4043;
          margin-bottom: 12px;
        }
        .muted {
          font-size: 13px;
          color: #9aa0a6;
        }
        .add-row {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
        }
        .select {
          flex: 1;
          padding: 8px;
          border: 1px solid #dadce0;
          border-radius: 6px;
          font-size: 14px;
          background: #ffffff;
        }
        .section-label {
          font-size: 13px;
          font-weight: 500;
          color: #5f6368;
          margin-bottom: 6px;
        }
        .list {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 8px 0;
          border-bottom: 1px solid #f1f3f4;
        }
        .name {
          font-size: 14px;
          color: #3c4043;
        }
        .sub {
          color: #9aa0a6;
          font-size: 12px;
        }
        .btn {
          padding: 5px 10px;
          border-radius: 6px;
          border: 1px solid #dadce0;
          background: #ffffff;
          color: #3c4043;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
        }
        .btn:hover:not(:disabled) {
          background: #f1f3f4;
        }
        .btn.primary {
          background: #1a73e8;
          color: #ffffff;
          border-color: #1a73e8;
        }
        .btn.primary:hover:not(:disabled) {
          background: #1557b2;
        }
        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
