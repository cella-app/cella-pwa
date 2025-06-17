import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
	const token = req.cookies.get('accessToken')?.value;

	const isAuthPage = req.nextUrl.pathname.startsWith('/auth');
	const isLoginPage = req.nextUrl.pathname === '/auth/login';
	const isProtectedRoute = req.nextUrl.pathname.startsWith('/[auth]/dashboard');

	if (!token && isProtectedRoute) {
		return NextResponse.redirect(new URL('/auth/login', req.url));
	}

	if (token && isAuthPage && !isLoginPage) {
		return NextResponse.redirect(new URL('/', req.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		'/auth/:path*',
		'/map',
	],
};
