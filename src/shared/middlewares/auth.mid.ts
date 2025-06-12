import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
	const token = req.cookies.get('accessToken')?.value;

	const isAuthPage = req.nextUrl.pathname.startsWith('/auth');
	const isProtectedRoute = req.nextUrl.pathname.startsWith('/dashboard');

	if (!token && isProtectedRoute) {
		return NextResponse.redirect(new URL('/auth/login', req.url));
	}

	if (token && isAuthPage) {
		return NextResponse.redirect(new URL('/', req.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		'/dashboard/:path*',
		'/auth/:path*',
		'/', // hoặc thêm các route bạn muốn kiểm tra
	],
};
