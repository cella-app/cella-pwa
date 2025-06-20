"use server";

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get('authToken')?.value;

  if (pathname === '/') {
    return NextResponse.redirect(new URL('/map', request.url));
  }

  const isPublicPath =
    pathname === '/auth/login' ||
    pathname === '/auth/register';


  if (isPublicPath && token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (!isPublicPath && !token) {
    const loginUrl = new URL('/auth/login', request.url);
    if ("/" != pathname) {
      loginUrl.searchParams.set('from', pathname);
    } else {
      loginUrl.searchParams.set('from', "/map");
    }

    console.log(pathname,loginUrl)
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/profile/:path*',
    '/map',
    '/auth/login',
    '/auth/register'
  ],
}; 