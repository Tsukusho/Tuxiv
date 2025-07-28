// /src/app/api/artworks/[id]/comments/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Comment from '@/models/comment';
import Artwork from '@/models/artwork';
import User from '@/models/user';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { bucket } from '@/lib/gcs';
/**
 * 作品のコメント一覧を取得するAPI
 */
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await context.params;
             const artworkId = id;

    const comments = await Comment.find({ artworkId })
      .sort({ createdAt: -1 }) // 新しい順
      .populate({
        path: 'userId',
        select: 'username profileImage',
        model: User,
      });

    // プロフィール画像のSigned URLを生成
    const commentsWithImageUrls = await Promise.all(
      comments.map(async (comment) => {
        const commentObj = comment.toObject();
        
        if (commentObj.userId && commentObj.userId.profileImage?.path) {
          try {
            const options = {
              version: 'v4' as const,
              action: 'read' as const,
              expires: Date.now() + 15 * 60 * 1000, // 15分
            };
            const [signedUrl] = await bucket.file(commentObj.userId.profileImage.path).getSignedUrl(options);
            commentObj.userId.profileImageUrl = signedUrl;
          } catch (error) {
            console.warn('プロフィール画像のSigned URL生成に失敗:', error);
          }
        }
        
        return commentObj;
      })
    );

    return NextResponse.json(commentsWithImageUrls);
  } catch (error) {
    console.error('GET Comments Error:', error);
    return NextResponse.json({ error: 'サーバーエラーです。' }, { status: 500 });
  }
}/**
 * 作品にコメントを投稿するAPI
 */
export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
    try {
      const JWT_SECRET = process.env.JWT_SECRET!;
      const cookieStore = await cookies();
      const token = cookieStore.get('token')?.value;
      
      if (!token) {
        return NextResponse.json({ error: 'ログインが必要です。' }, { status: 401 });
      }
  
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
      const userId = decoded.id;
      const { id } = await context.params;
      const artworkId = id;
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
  