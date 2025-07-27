// /src/app/api/artworks/[id]/comments/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Comment from '@/models/comment';
import Artwork from '@/models/artwork';
import User from '@/models/user';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { cookies } from 'next/headers';
/**
 * 作品のコメント一覧を取得するAPI
 */
type RouteContext = { params: { id: string } }

export async function GET(req: Request, context: RouteContext) {
  try {
    await dbConnect();
            const artworkId = context.params.id;

    const comments = await Comment.find({ artworkId })
      .sort({ createdAt: -1 }) // 新しい順
      .populate({
        path: 'userId',
        select: 'username',
        model: User,
      });

    return NextResponse.json(comments);
  } catch (error) {
    console.error('GET Comments Error:', error);
    return NextResponse.json({ error: 'サーバーエラーです。' }, { status: 500 });
  }
}/**
 * 作品にコメントを投稿するAPI
 */
export async function POST(req: Request, context: RouteContext) {
    try {
      const JWT_SECRET = process.env.JWT_SECRET!;
      const cookieStore = await cookies();
      const token = cookieStore.get('token')?.value;
      
      if (!token) {
        return NextResponse.json({ error: 'ログインが必要です。' }, { status: 401 });
      }
  
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
      const userId = decoded.id;
      const artworkId = context.params.id;
      const { text } = await req.json();
  
      if (!text || text.trim() === '') {
        return NextResponse.json({ error: 'コメント本文を入力してください。' }, { status: 400 });
      }
  
      await dbConnect();
  
      const artwork = await Artwork.findById(artworkId);
      if (!artwork) {
        return NextResponse.json({ error: '作品が見つかりません。' }, { status: 404 });
      }
  
      const newComment = await Comment.create({ artworkId, userId, text });
      
      artwork.commentCount = (artwork.commentCount || 0) + 1;
      await artwork.save();
      
      const populatedComment = await Comment.findById(newComment._id).populate({
          path: 'userId',
          select: 'username',
          model: User,
      });
  
      return NextResponse.json(populatedComment, { status: 201 });
      
    } catch (error) {
      console.error('POST Comment Error:', error);
      return NextResponse.json({ error: 'サーバーエラーです。' }, { status: 500 });
    }
  }
  