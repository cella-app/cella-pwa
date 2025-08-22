'use client';

import { Suspense } from 'react';
import AuthLayoutWrapper from './wrapper';


export default function AuthLayout({ children }: { children: React.ReactNode }) {
	return <Suspense>
				<AuthLayoutWrapper>{children}</AuthLayoutWrapper>
			</Suspense> ;
}