"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { MasterTypeItem } from "../_types/masterType";
import { createMasterType, fetchMasterTypes, updateMasterType } from "./query";

// 1マスタ分のデータ層。list 取得 + 追加/更新 mutation をまとめ、成功時にキャッシュ無効化する。
// UI 側の副作用 (入力クリア・alert) は呼び出し側で mutate(vars, {onSuccess,onError}) で渡す。
export function useMasterType(endpoint: string, queryKey: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: [queryKey] });

  const list = useQuery({
    queryKey: [queryKey],
    queryFn: () => fetchMasterTypes(endpoint),
  });

  const create = useMutation({
    mutationFn: (name: string) => createMasterType(endpoint, name),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<MasterTypeItem> }) =>
      updateMasterType(endpoint, id, patch),
    onSuccess: invalidate,
  });

  return {
    items: list.data ?? [],
    isLoading: list.isLoading,
    create,
    update,
    isSaving: create.isPending || update.isPending,
  };
}
