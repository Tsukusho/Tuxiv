import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth";
import { bucket } from "@/lib/gcs";

export async function POST(req: Request) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "認証が必要です。" },
        { status: 401 },
      );
    }

    const { fileName, fileType, fileSize } = await req.json();

    if (!fileName || !fileType) {
      return NextResponse.json(
        { error: "ファイル名とタイプは必須です。" },
        { status: 400 },
      );
    }

    // ファイルサイズチェック
    if (fileSize > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "ファイルサイズは10MB以下にしてください。" },
        { status: 400 },
      );
    }

    // 一意のファイル名生成
    const uniqueFilename = `${userId}-${Date.now()}-${fileName}`;

    // 署名付きURL生成（15分間有効）
    const [signedUrl] = await bucket.file(uniqueFilename).getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + 15 * 60 * 1000, // 15分
      contentType: fileType,
    });

    return NextResponse.json({
      signedUrl,
      fileName: uniqueFilename,
      fileType,
      fileSize,
    });
  } catch (error: unknown) {
    console.error("Signed URL generation failed:", error);

    return NextResponse.json(
      { error: "サーバーで予期せぬエラーが発生しました。" },
      { status: 500 },
    );
  }
}
