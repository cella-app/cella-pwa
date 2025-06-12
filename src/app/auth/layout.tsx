'use client';

import AuthLayoutWrapper from './wrapper';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
	return <AuthLayoutWrapper>{children}</AuthLayoutWrapper>;
}
