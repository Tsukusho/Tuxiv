import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Performance from '@/models/performance';
import PerformanceType from '@/models/performanceType';
import { getAuthenticatedUserId } from '@/lib/auth';

export async function GET() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: '認証が必要です。' }, { status: 401 });
  }

  await dbConnect();
  const performances = await Performance.find({}).populate('typeId').sort({ year: -1 });
  return NextResponse.json(performances);
}

export async function POST(request: NextRequest) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: '認証が必要です。' }, { status: 401 });
  }

  await dbConnect();
  const { year, typeId } = await request.json();

  if (typeof year !== 'number' || !typeId) {
    return NextResponse.json({ message: 'year と typeId は必須です' }, { status: 400 });
  }

  const type = await PerformanceType.findById(typeId);
  if (!type) {
    return NextResponse.json({ message: 'PerformanceType が見つかりません' }, { status: 404 });
  }

  const performance = await Performance.findOneAndUpdate(
    { year, typeId },
    { $setOnInsert: { year, typeId, displayName: type.name } },
    { upsert: true, new: true }
  ).populate('typeId');

  return NextResponse.json(performance);
}
