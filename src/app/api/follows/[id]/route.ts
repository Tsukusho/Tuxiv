import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth";
import dbConnect from "@/lib/dbConnect";
import Follow from "@/models/follow";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const followerId = await getAuthenticatedUserId();
    if (!followerId) {
      return NextResponse.json({ isFollowing: false });
    }

    const { id } = await context.params;
    const followingId = id;

    await dbConnect();
    const existingFollow = await Follow.findOne({ followerId, followingId });
    return NextResponse.json({ isFollowing: !!existingFollow });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ isFollowing: false });
  }
}
export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const followerId = await getAuthenticatedUserId();
    if (!followerId) {
      return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
    }

    const { id } = await context.params;
    const followingId = id;

    if (followerId === followingId) {
      return NextResponse.json({ error: "自分自身をフォローすることはできません。" }, { status: 400 });
    }

    await dbConnect();

    const existingFollow = await Follow.findOne({ followerId, followingId });
    if (existingFollow) {
      return NextResponse.json({ error: "既にフォロー済みです。" }, { status: 409 });
    }

    await Follow.create({ followerId, followingId });

    return NextResponse.json({ message: "フォローしました。" }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "サーバーエラーです。" }, { status: 500 });
  }
}
export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const followerId = await getAuthenticatedUserId();
    if (!followerId) {
      return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
    }

    const { id } = await context.params;
    const followingId = id;

    await dbConnect();

    const result = await Follow.deleteOne({ followerId, followingId });
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "フォローしていません。" }, { status: 404 });
    }

    return NextResponse.json({ message: "フォローを解除しました。" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "サーバーエラーです。" }, { status: 500 });
  }
}
