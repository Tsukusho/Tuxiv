"use client";

import InfiniteArtworkGrid from "@/components/InfiniteArtworkGrid";
import { useGlobalTimeline } from "../_hooks/useGlobalTimeline";

export default function GlobalTimeline() {
  const timeline = useGlobalTimeline();
  return <InfiniteArtworkGrid {...timeline} />;
}
