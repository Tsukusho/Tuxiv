"use client";

import { useState } from "react";
import { apiErrorMessage } from "@/lib/fetchClient";
import { useMasterType } from "../_hooks/useMasterType";
import type { MasterTypeItem } from "../_types/masterType";

interface Props {
  title: string;
  endpoint: string; // 例: /api/admin/role-types
  queryKey: string;
}

// 公演種類 / 役職 のマスタを編集する共通エディタ (表示層)。データ層は useMasterType。
export default function MasterTypeEditor({ title, endpoint, queryKey }: Props) {
  const { items, isLoading, create, update, isSaving } = useMasterType(endpoint, queryKey);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) return;
    create.mutate(name, {
      onSuccess: () => setNewName(""),
      onError: (error) => alert(apiErrorMessage(error, "追加に失敗しました")),
    });
  };

  const handleRename = (id: string) => {
    update.mutate(
      { id, patch: { name: editName.trim() } },
      {
        onSuccess: () => setEditingId(null),
        onError: (error) => alert(apiErrorMessage(error, "更新に失敗しました")),
      },
    );
  };

  const handleToggleActive = (item: MasterTypeItem) => {
    update.mutate(
      { id: item._id, patch: { isActive: !item.isActive } },
      { onError: (error) => alert(apiErrorMessage(error, "更新に失敗しました")) },
    );
  };

  const startEdit = (item: MasterTypeItem) => {
    setEditingId(item._id);
    setEditName(item.name);
  };

  return (
    <div className="master-editor">
      <h2 className="title">{title}</h2>

      {isLoading ? (
        <p className="muted">読み込み中...</p>
      ) : (
        <ul className="list">
          {items.map((item) => (
            <li key={item._id} className={`row ${item.isActive ? "" : "inactive"}`}>
              {editingId === item._id ? (
                <input
                  className="name-input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  disabled={isSaving}
                />
              ) : (
                <span className="name">
                  {item.name}
                  {!item.isActive && <span className="badge">無効</span>}
                </span>
              )}

              <div className="actions">
                {editingId === item._id ? (
                  <>
                    <button
                      type="button"
                      className="btn primary"
                      disabled={isSaving || !editName.trim()}
                      onClick={() => handleRename(item._id)}
                    >
                      保存
                    </button>
                    <button type="button" className="btn" disabled={isSaving} onClick={() => setEditingId(null)}>
                      取消
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" className="btn" disabled={isSaving} onClick={() => startEdit(item)}>
                      改名
                    </button>
                    <button type="button" className="btn" disabled={isSaving} onClick={() => handleToggleActive(item)}>
                      {item.isActive ? "無効化" : "有効化"}
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="add-row">
        <input
          className="name-input"
          placeholder={`${title}を追加`}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          disabled={isSaving}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCreate();
          }}
        />
        <button type="button" className="btn primary" disabled={isSaving || !newName.trim()} onClick={handleCreate}>
          追加
        </button>
      </div>

      <style jsx>{`
        .master-editor {
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
        .list {
          list-style: none;
          margin: 0 0 12px;
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
        .row.inactive .name {
          color: #9aa0a6;
        }
        .name {
          font-size: 14px;
          color: #3c4043;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .badge {
          font-size: 11px;
          color: #9aa0a6;
          border: 1px solid #dadce0;
          border-radius: 10px;
          padding: 1px 6px;
        }
        .actions {
          display: flex;
          gap: 6px;
          flex-shrink: 0;
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
        .add-row {
          display: flex;
          gap: 8px;
        }
        .name-input {
          flex: 1;
          padding: 8px;
          border: 1px solid #dadce0;
          border-radius: 6px;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}
