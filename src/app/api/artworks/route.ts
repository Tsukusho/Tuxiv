
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { bucket } from '@/lib/gcs';
import Artwork from '@/models/artwork';
import User from '@/models/user';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

/**
 * 新しい作品を投稿するAPI
 * @param {Request} req - multipart/form-data形式のリクエスト
 * @returns {NextResponse} 作成された作品情報またはエラーメッセージ
 */
export async function POST(req: Request) {
  const JWT_SECRET = process.env.JWT_SECRET!;
  await dbConnect();
  console.log('dbConnect done');

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: '認証トークンが必要です。' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    
    const user = await User.findById(decoded.id);
    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません。' }, { status: 404 });
    }

    const formData = await req.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const tags = (formData.get('tags') as string).split(',').map(tag => tag.trim());
    const isNSFW = formData.get('isNSFW') === 'true';
    const isAnonymous = formData.get('isAnonymous') === 'true';
    const files = formData.getAll('images') as File[];

    if (!title || files.length === 0) {
      return NextResponse.json({ error: 'タイトルと画像は必須です。' }, { status: 400 });
    }

    if (tags.length === 0) {
      return NextResponse.json({ error: 'タグは最低1つ必須です。' }, { status: 400 });
    }

    const uploadedImages: Array<{path: string; mimeType: string; size: number; order: number}> = [];
    const uploadedFilePaths: string[] = [];

    await Promise.all(
      files.map(async (file, index) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        const uniqueFilename = `${user._id}-${Date.now()}-${file.name}`;
        
        const gcsFile = bucket.file(uniqueFilename);
        
        await gcsFile.save(buffer, {
          metadata: { contentType: file.type },
        });

        uploadedFilePaths.push(uniqueFilename);
        uploadedImages.push({
          path: uniqueFilename,
          mimeType: file.type,
          size: file.size,
          order: index,
        });
      })
    );
    
    const newArtwork = await Artwork.create({
      userId: user._id,
      title,
      description,
      tags,
      isNSFW,
      isAnonymous,
      images: uploadedImages.sort((a, b) => a.order - b.order),
    });

    return NextResponse.json(newArtwork, { status: 201 });

  } catch (error: unknown) {
    console.error('Artwork creation failed:', error);
    
    if (error instanceof Error && (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError')) {
      return NextResponse.json({ error: '認証が無効です。' }, { status: 401 });
    }

    // NOTE: ここにGCSのロールバック処理を追加することも可能

    return NextResponse.json(
      { error: 'サーバーで予期せぬエラーが発生しました。' },
      { status: 500 }
    );
  }
}                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               