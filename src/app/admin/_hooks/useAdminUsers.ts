"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAdminUsers, updateUserGraduation } from "./query";

// 卒業フラグ管理のデータ層。全ユーザー取得 + 卒業フラグ更新 mutation。
// UI 側の副作用 (alert 等) は mutate(vars, {onError}) で注入する。
export function useAdminUsers() {
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["admin-users"],
    queryFn: fetchAdminUsers,
  });

  const setGraduation = useMutation({
    mutationFn: ({ id, isGraduated }: { id: string; isGraduated: boolean }) =>
      updateUserGraduation(id, isGraduated),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  return {
    users: list.data ?? [],
    isLoading: list.isLoading,
    setGraduation,
    isSaving: setGraduation.isPending,
  };
}
