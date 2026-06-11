import { fetchClient } from "@/lib/fetchClient";
import type { AdminUser } from "../_types/adminUser";
import type { MasterTypeItem } from "../_types/masterType";

// admin マスタ (公演種類 / 役職) の fetchClient バインディング。
// endpoint を差し替えて両マスタで使い回す。
export function fetchMasterTypes(endpoint: string) {
  return fetchClient<MasterTypeItem[]>(endpoint);
}

export function createMasterType(endpoint: string, name: string) {
  return fetchClient(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
}

export function updateMasterType(endpoint: string, id: string, patch: Partial<MasterTypeItem>) {
  return fetchClient(`${endpoint}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}

// 卒業フラグ管理のユーザー一覧 / 更新。
export function fetchAdminUsers() {
  return fetchClient<AdminUser[]>("/api/admin/users");
}

export function updateUserGraduation(id: string, isGraduated: boolean) {
  return fetchClient(`/api/admin/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isGraduated }),
  });
}
