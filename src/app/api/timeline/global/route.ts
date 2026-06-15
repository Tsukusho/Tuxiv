// /src/app/api/timeline/global/route.ts
// 全ユーザーの作品を時系列フラットで返す TL。匿名投稿は含めるが author を隠す。

import { NextResponse } from "next/server";
import { fetchArtworkPage, getViewerContext } from "@/app/api/timeline/_artworks";

export async function GET(req: Request) {
  try {
    const viewer = await getViewerContext();
    if (!viewer) {
      return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
    }

    const cursor = new URL(req.url).searchParams.get("cursor");
    const page = await fetchArtworkPage(viewer, { cursor });
    return NextResponse.json(page);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "サーバーエラーです。" }, { status: 500 });
  }
}
