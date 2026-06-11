"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { fetchClient } from "@/lib/fetchClient";

interface PerformanceType {
  _id: string;
  name: string;
  order: number;
  isActive: boolean;
}

interface RoleType {
  _id: string;
  name: string;
  order: number;
  isActive: boolean;
}

interface PopulatedPerformance {
  _id: string;
  year: number;
  typeId: PerformanceType;
  displayName: string;
}

interface PerformanceRoleIndex {
  performanceId: PopulatedPerformance;
  roleTypeIds: RoleType[];
}

interface UserCalendarResponse {
  _id?: string;
  userId?: string;
  performances?: PerformanceRoleIndex[];
  lastInputDate?: string;
}

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 11 }, (_, i) => CURRENT_YEAR - 5 + i);
const SAVE_FEEDBACK_MS = 150; // 保存は一瞬で終わるので、保存中をあえてこの時間見せる

export default function UserCalendarEditor({ onSavingChange }: { onSavingChange?: (saving: boolean) => void }) {
  const queryClient = useQueryClient();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newYear, setNewYear] = useState<number>(CURRENT_YEAR);
  const [newTypeId, setNewTypeId] = useState<string>("");

  const performanceTypesQuery = useQuery({
    queryKey: ["performanceTypes"],
    queryFn: () => fetchClient<PerformanceType[]>("/api/performance-types"),
  });
  const roleTypesQuery = useQuery({
    queryKey: ["roleTypes"],
    queryFn: () => fetchClient<RoleType[]>("/api/role-types"),
  });
  const calendarQuery = useQuery({
    queryKey: ["userCalendar"],
    queryFn: () => fetchClient<UserCalendarResponse | null>("/api/user-calendar"),
  });

  const performanceTypes = performanceTypesQuery.data ?? [];
  const roleTypes = roleTypesQuery.data ?? [];
  const entries = calendarQuery.data?.performances ?? [];
  const isLoading = performanceTypesQuery.isLoading || roleTypesQuery.isLoading || calendarQuery.isLoading;

  const existingKeys = new Set(entries.map((e) => `${e.performanceId.year}_${e.performanceId.typeId._id}`));

  const saveMutation = useMutation({
    mutationFn: async (next: PerformanceRoleIndex[]) => {
      const payload = {
        performances: next.map((e) => ({
          performanceId: e.performanceId._id,
          roleTypeIds: e.roleTypeIds.map((r) => r._id),
        })),
      };
      // 保存中をあえて SAVE_FEEDBACK_MS 見せるため、PUT と最小待ち時間を並走させる
      const [updated] = await Promise.all([
        fetchClient<UserCalendarResponse>("/api/user-calendar", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
        new Promise((resolve) => setTimeout(resolve, SAVE_FEEDBACK_MS)),
      ]);
      return updated;
    },
    onMutate: () => onSavingChange?.(true),
    onSettled: () => onSavingChange?.(false),
    onSuccess: (updated) => queryClient.setQueryData(["userCalendar"], updated),
    onError: () => alert("保存に失敗しました"),
  });

  const handleAddPerformance = async () => {
    if (existingKeys.has(`${newYear}_${newTypeId}`)) {
      alert("この公演は既に追加されています");
      return;
    }
    let performance: PopulatedPerformance;
    try {
      performance = await fetchClient<PopulatedPerformance>("/api/performances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year: newYear, typeId: newTypeId }),
      });
    } catch (error) {
      console.error(error);
      alert("公演の追加に失敗しました");
      return;
    }
    const newEntry: PerformanceRoleIndex = { performanceId: performance, roleTypeIds: [] };
    // 追加した公演は末尾に積まれるので、そのまま役職選択を開く
    const newIndex = entries.length;
    saveMutation.mutate([...entries, newEntry]);
    setIsAdding(false);
    setNewYear(CURRENT_YEAR);
    setNewTypeId(performanceTypes[0]?._id || "");
    setEditingIndex(newIndex);
  };

  const handleDelete = (index: number) => {
    saveMutation.mutate(entries.filter((_, i) => i !== index));
    setDeleteConfirmIndex(null);
    if (editingIndex === index) setEditingIndex(null);
  };

  const handleToggleRole = (entryIndex: number, roleType: RoleType) => {
    const entry = entries[entryIndex];
    const has = entry.roleTypeIds.some((r) => r._id === roleType._id);
    const nextRoleTypeIds = has
      ? entry.roleTypeIds.filter((r) => r._id !== roleType._id)
      : [...entry.roleTypeIds, roleType];
    const next = entries.map((e, i) => (i === entryIndex ? { ...e, roleTypeIds: nextRoleTypeIds } : e));
    saveMutation.mutate(next);
  };

  if (isLoading) {
    return <div className="text-sm text-gray-500">所属公演を読み込み中...</div>;
  }

  return (
    <div className="user-calendar-editor">
      <h4 className="text-base font-medium text-gray-900 mb-3">担当公演と役職</h4>

      {entries.length === 0 && !isAdding && <p className="text-sm text-gray-500 mb-3">まだ公演が登録されていません</p>}

      <div className="entries">
        {entries.map((entry, idx) => (
          <div key={entry.performanceId._id} className="entry-card">
            <div className="entry-header">
              <div className="entry-title">
                <span className="entry-name">
                  {entry.performanceId.year}年度 {entry.performanceId.displayName}
                </span>
                {editingIndex !== idx && (
                  <span className="entry-roles">
                    {entry.roleTypeIds.map((r) => r.name).join(", ") || <em className="muted">役職未選択</em>}
                  </span>
                )}
              </div>
              <div className="entry-actions">
                <button
                  type="button"
                  onClick={() => setEditingIndex(editingIndex === idx ? null : idx)}
                  className="btn-edit"
                >
                  {editingIndex === idx ? "完了" : "編集"}
                </button>
                <button type="button" onClick={() => setDeleteConfirmIndex(idx)} className="btn-delete">
                  削除
                </button>
              </div>
            </div>
            {editingIndex === idx && (
              <div className="role-toggles">
                {roleTypes.map((rt) => {
                  const active = entry.roleTypeIds.some((r) => r._id === rt._id);
                  return (
                    <button
                      key={rt._id}
                      type="button"
                      onClick={() => handleToggleRole(idx, rt)}
                      className={`role-toggle ${active ? "active" : ""}`}
                    >
                      {rt.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {isAdding ? (
        <div className="add-form">
          <div className="form-row">
            <label>年度</label>
            <select value={newYear} onChange={(e) => setNewYear(Number(e.target.value))}>
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y} disabled={existingKeys.has(`${y}_${newTypeId}`)}>
                  {y}年度
                </option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <label>公演</label>
            <select value={newTypeId} onChange={(e) => setNewTypeId(e.target.value)}>
              {performanceTypes.map((pt) => (
                <option key={pt._id} value={pt._id} disabled={existingKeys.has(`${newYear}_${pt._id}`)}>
                  {pt.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-actions">
            <button type="button" onClick={handleAddPerformance} className="btn-primary">
              追加
            </button>
            <button type="button" onClick={() => setIsAdding(false)} className="btn-secondary">
              キャンセル
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setIsAdding(true);
            if (!newTypeId) setNewTypeId(performanceTypes[0]?._id ?? "");
          }}
          className="btn-add-trigger"
        >
          + 別公演を追加
        </button>
      )}

      {deleteConfirmIndex !== null && (
        <div className="modal-overlay" onClick={() => setDeleteConfirmIndex(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <p className="modal-text">
              「{entries[deleteConfirmIndex].performanceId.year}年度{" "}
              {entries[deleteConfirmIndex].performanceId.displayName}」を削除しますか？
            </p>
            <div className="modal-actions">
              <button type="button" onClick={() => handleDelete(deleteConfirmIndex)} className="btn-danger">
                削除する
              </button>
              <button type="button" onClick={() => setDeleteConfirmIndex(null)} className="btn-secondary">
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .user-calendar-editor {
          margin-bottom: 16px;
        }

        .entry-card {
          background: #ffffff;
          border: 1px solid #e8eaed;
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 8px;
        }

        .entry-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          flex-wrap: wrap;
        }

        .entry-title {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
          flex: 1;
        }

        .entry-name {
          font-size: 14px;
          font-weight: 500;
          color: #3c4043;
        }

        .entry-roles {
          font-size: 13px;
          color: #5f6368;
        }

        .muted {
          color: #9aa0a6;
          font-style: italic;
        }

        .entry-actions {
          display: flex;
          gap: 6px;
          flex-shrink: 0;
        }

        .btn-edit,
        .btn-delete,
        .btn-primary,
        .btn-secondary,
        .btn-danger,
        .btn-add-trigger {
          padding: 6px 12px;
          border-radius: 6px;
          border: 1px solid #dadce0;
          background: #ffffff;
          color: #3c4043;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .btn-edit:hover:not(:disabled),
        .btn-delete:hover:not(:disabled),
        .btn-secondary:hover:not(:disabled),
        .btn-add-trigger:hover:not(:disabled) {
          background: #f1f3f4;
        }

        .btn-delete {
          color: #d93025;
        }

        .btn-primary {
          background: #1a73e8;
          color: white;
          border-color: #1a73e8;
        }

        .btn-primary:hover:not(:disabled) {
          background: #1557b2;
        }

        .btn-danger {
          background: #d93025;
          color: white;
          border-color: #d93025;
        }

        .btn-danger:hover:not(:disabled) {
          background: #b1271b;
        }

        .btn-add-trigger {
          width: 100%;
          padding: 10px;
          border-style: dashed;
          color: #1a73e8;
          border-color: #1a73e8;
        }

        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .role-toggles {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px dashed #e8eaed;
        }

        .role-toggle {
          padding: 6px 12px;
          border-radius: 16px;
          border: 1px solid #dadce0;
          background: #ffffff;
          color: #5f6368;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .role-toggle:hover:not(:disabled) {
          background: #f1f3f4;
        }

        .role-toggle.active {
          background: #e3f2fd;
          color: #1976d2;
          border-color: #1976d2;
        }

        .add-form {
          background: #f8f9fa;
          border: 1px solid #e8eaed;
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 8px;
        }

        .form-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .form-row label {
          flex-shrink: 0;
          width: 48px;
          font-size: 13px;
          color: #3c4043;
        }

        .form-row select {
          flex: 1;
          padding: 8px;
          border: 1px solid #dadce0;
          border-radius: 6px;
          font-size: 14px;
          background: #ffffff;
        }

        .form-actions {
          display: flex;
          gap: 6px;
          justify-content: flex-end;
          margin-top: 8px;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
        }

        .modal-content {
          background: #ffffff;
          border-radius: 12px;
          padding: 24px;
          max-width: 400px;
          width: 90%;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        }

        .modal-text {
          font-size: 14px;
          color: #3c4043;
          margin-bottom: 16px;
        }

        .modal-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }
      `}</style>
    </div>
  );
}
