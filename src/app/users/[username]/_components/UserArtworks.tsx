"use client";

import InfiniteArtworkGrid from "@/components/InfiniteArtworkGrid";
import { useUserArtworks } from "../_hooks/useUserArtworks";

export default function UserArtworks({ username }: { username: string }) {
  const timeline = useUserArtworks(username);
  return <InfiniteArtworkGrid {...timeline} emptyMessage="まだ作品がありません。" />;
}
