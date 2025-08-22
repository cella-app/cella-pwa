'use client';

import AuthLayoutWrapper from './wrapper';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getToken } from '@/shared/utils/auth';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { userAlertStore } from '@/features/alert/stores/alert.store';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { isAuthenticated, initializeAuth } = useAuthStore();
	const { clearAlerts } = userAlertStore()


	useEffect(() => {
		initializeAuth();
		clearAlerts();
		
		const from = searchParams?.get('from') || '/workspace/discovery';
		router.prefetch(from)

		const token = getToken();
		if (token || isAuthenticated) {
			router.push(from)
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isAuthenticated, searchParams]);

	return <AuthLayoutWrapper>{children}</AuthLayoutWrapper>;
}