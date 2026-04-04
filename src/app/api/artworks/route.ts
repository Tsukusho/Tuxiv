
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Artwork from '@/models/artwork';
import User from '@/models/user';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

/**
 * 新しい作品を投稿するAPI
 * @param {Request} req - JSON形式のリクエスト（アップロード済み画像メタデータ）
 * @returns {NextResponse} 作成された作品情報またはエラーメッセージ
 */
export async function POST(req: Request) {
  const JWT_SECRET = process.env.JWT_SECRET!;
  await dbConnect();

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

    const requestData = await req.json();
    const { title, description, tags, isNSFW, isAnonymous, uploadedImages } = requestData;

    if (!title || !uploadedImages || uploadedImages.length === 0) {
      return NextResponse.json({ error: 'タイトルと画像は必須です。' }, { status: 400 });
    }

    if (!tags || tags.length === 0) {
      return NextResponse.json({ error: 'タグは最低1つ必須です。' }, { status: 400 });
    }

    // アップロード済み画像の検証
    interface UploadedImageData {
      fileName: string;
      fileType: string;
      fileSize: number;
    }
    
    interface ValidatedImage {
      path: string;
      mimeType: string;
      size: number;
      order: number;
    }
    
    const validatedImages: ValidatedImage[] = uploadedImages.map((img: UploadedImageData, index: number) => ({
      path: img.fileName,
      mimeType: img.fileType,
      size: img.fileSize,
      order: index,
    }));
    
    const newArtwork = await Artwork.create({
      userId: user._id,
      title,
      description,
      tags,
      isNSFW,
      isAnonymous,
      images: validatedImages.sort((a: ValidatedImage, b: ValidatedImage) => a.order - b.order),
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