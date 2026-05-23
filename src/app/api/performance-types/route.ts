import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PerformanceType from '@/models/performanceType';
import { getAuthenticatedUserId } from '@/lib/auth';

export async function GET() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: '認証が必要です。' }, { status: 401 });
  }

  await dbConnect();
  const types = await PerformanceType.find({ isActive: true }).sort({ order: 1 });
  return NextResponse.json(types);
}
