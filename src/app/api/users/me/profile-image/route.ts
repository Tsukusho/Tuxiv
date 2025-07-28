import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { bucket } from '@/lib/gcs';
import User from '@/models/user';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

/**
 * ユーザーIDを取得するヘルパー関数
 */
async function getUserIdFromToken(): Promise<string> {
  const JWT_SECRET = process.env.JWT_SECRET!;
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    throw new Error('認証トークンが必要です。');
  }

  const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
  return decoded.id;
}

/**
 * プロフィール画像をアップロードするAPI
 */
export async function POST(req: Request) {
  try {
    const userId = await getUserIdFromToken();
    await dbConnect();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません。' }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get('profileImage') as File;

    if (!file) {
      return NextResponse.json({ error: 'プロフィール画像ファイルが必要です。' }, { status: 400 });
    }

    // ファイル種別チェック
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: '画像ファイルのみアップロード可能です。' }, { status: 400 });
    }

    // ファイルサイズチェック（5MB制限）
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'ファイルサイズは5MB以下にしてください。' }, { status: 400 });
    }

    // 既存のプロフィール画像があれば削除
    if (user.profileImage?.path) {
      try {
        await bucket.file(user.profileImage.path).delete();
      } catch (error) {
        console.warn('既存プロフィール画像の削除に失敗:', error);
      }
    }

    // 新しい画像をアップロード
    const buffer = Buffer.from(await file.arrayBuffer());
    const uniqueFilename = `profile-${userId}-${Date.now()}-${file.name}`;
    const gcsFile = bucket.file(uniqueFilename);

    await gcsFile.save(buffer, {
      metadata: { contentType: file.type },
    });

    // データベースを更新
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        profileImage: {
          path: uniqueFilename,
          mimeType: file.type,
          uploadedAt: new Date()
        }
      },
      { new: true }
    );

    return NextResponse.json({ 
      message: 'プロフィール画像をアップロードしました。',
      profileImage: updatedUser?.profileImage
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Profile image upload failed:', error);

    if (error instanceof Error) {
      if (error.message === '認証トークンが必要です。') {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
    }

    return NextResponse.json(
      { error: 'プロフィール画像のアップロード中にエラーが発生しました。' },
      { status: 500 }
    );
  }
}

/**
 * プロフィール画像を削除するAPI
 */
export async function DELETE() {
  try {
    const userId = await getUserIdFromToken();
    await dbConnect();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません。' }, { status: 404 });
    }

    if (!user.profileImage?.path) {
      return NextResponse.json({ error: 'プロフィール画像が設定されていません。' }, { status: 404 });
    }

    // GCSから画像を削除
    try {
      await bucket.file(user.profileImage.path).delete();
    } catch (error) {
      console.warn('GCSからの画像削除に失敗:', error);
    }

    // データベースから画像情報を削除
    await User.findByIdAndUpdate(userId, { $unset: { profileImage: 1 } });

    return NextResponse.json({ message: 'プロフィール画像を削除しました。' }, { status: 200 });

  } catch (error: unknown) {
    console.error('Profile image deletion failed:', error);

    if (error instanceof Error) {
      if (error.message === '認証トークンが必要です。') {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
    }

    return NextResponse.json(
      { error: 'プロフィール画像の削除中にエラーが発生しました。' },
      { status: 500 }
    );
  }
} 