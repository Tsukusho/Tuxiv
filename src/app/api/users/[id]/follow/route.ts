import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { cookies } from 'next/headers';
import Follow from '@/models/follow';
import jwt from 'jsonwebtoken';


export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const JWT_SECRET = process.env.JWT_SECRET!;
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ isFollowing: false });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const followerId = decoded.id;
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
export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const JWT_SECRET = process.env.JWT_SECRET!;
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: '認証トークンが必要です。' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const followerId = decoded.id; 
    const { id } = await context.params;
    const followingId = id; 

    if (followerId === followingId) {
      return NextResponse.json({ error: '自分自身をフォローすることはできません。' }, { status: 400 });
    }

    await dbConnect();

    const existingFollow = await Follow.findOne({ followerId, followingId });
    if (existingFollow) {
      return NextResponse.json({ error: '既にフォロー済みです。' }, { status: 409 });
    }
    
    await Follow.create({ followerId, followingId });

    return NextResponse.json({ message: 'フォローしました。' }, { status: 201 });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'サーバーエラーです。' }, { status: 500 });
  }
}
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
    try {
        const JWT_SECRET = process.env.JWT_SECRET!;
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
    
        if (!token) {
          return NextResponse.json({ error: '認証トークンが必要です。' }, { status: 401 });
        }
    
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
        const followerId = decoded.id;
          const { id } = await context.params;
          const followingId = id;
    
        await dbConnect();
    
        const result = await Follow.deleteOne({ followerId, followingId });
        if (result.deletedCount === 0) {
            return NextResponse.json({ error: 'フォローしていません。' }, { status: 404 });
        }
    
        return NextResponse.json({ message: 'フォローを解除しました。' });
    
      } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'サーバーエラーです。' }, { status: 500 });
      }
}