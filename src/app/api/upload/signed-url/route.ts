import { NextResponse } from 'next/server';
import { bucket } from '@/lib/gcs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  const JWT_SECRET = process.env.JWT_SECRET!;

  try {
    // 認証チェック
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: '認証トークンが必要です。' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    
    const { fileName, fileType, fileSize } = await req.json();

    if (!fileName || !fileType) {
      return NextResponse.json({ error: 'ファイル名とタイプは必須です。' }, { status: 400 });
    }

    // ファイルサイズチェック
    if (fileSize > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'ファイルサイズは10MB以下にしてください。' }, { status: 400 });
    }

    // 一意のファイル名生成
    const uniqueFilename = `${decoded.id}-${Date.now()}-${fileName}`;
    
    // 署名付きURL生成（15分間有効）
    const [signedUrl] = await bucket.file(uniqueFilename).getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000, // 15分
      contentType: fileType,
    });

    return NextResponse.json({
      signedUrl,
      fileName: uniqueFilename,
      fileType,
      fileSize
    });

  } catch (error: unknown) {
    console.error('Signed URL generation failed:', error);
    
    if (error instanceof Error && (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError')) {
      return NextResponse.json({ error: '認証が無効です。' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'サーバーで予期せぬエラーが発生しました。' },
      { status: 500 }
    );
  }
} 