import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { token } = await request.json(); // 👈 nhận thêm sessionToken từ client

  const response = NextResponse.json({ success: true });

  response.cookies.set('authToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 15,
  });

  response.cookies.set('directus_session_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 15,
  });

  return response;
}
