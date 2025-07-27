import { serialize } from 'cookie';
import { NextResponse } from 'next/server';

export async function POST() {
  const cookie = serialize('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    maxAge: -1,
    path: '/',
  });
  return new NextResponse(JSON.stringify({ message: 'ログアウトしました。' }), {
    status: 200,
    headers: { 'Set-Cookie': cookie },
  });
}