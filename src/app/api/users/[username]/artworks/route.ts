// GET /api/users/[username]/artworks — その人の作品を時系列フラットで返す (global の userId 絞り版)。
// 匿名投稿も含める (global と同じく author は隠す)。

import type { Types } from "mongoose";
import { NextResponse } from "next/server";
import { fetchArtworkPage, getViewerContext } from "@/app/api/timeline/_artworks";
import User from "@/models/user";

export async function GET(req: Request, { params }: { params: Promise<{ username: string }> }) {
  try {
    const viewer = await getViewerContext();
    if (!viewer) {
      return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
    }

    const { username } = await params;
    const profileUser = await User.findOne({ username }).select("_id").lean<{ _id: Types.ObjectId }>();
    if (!profileUser) {
      return NextResponse.json({ error: "ユーザーが見つかりません。" }, { status: 404 });
    }

    const cursor = new URL(req.url).searchParams.get("cursor");
    const page = await fetchArtworkPage(viewer, { cursor, filter: { userId: profileUser._id } });
    return NextResponse.json(page);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "サーバーエラーです。" }, { status: 500 });
  }
}
