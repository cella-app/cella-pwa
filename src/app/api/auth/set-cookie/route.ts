import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { token } = await request.json();
  
  const response = NextResponse.json({ success: true });
  
  response.cookies.set('authToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  });

  return response;
} 