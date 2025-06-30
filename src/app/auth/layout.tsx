'use client';

import AuthLayoutWrapper from './wrapper';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/shared/utils/auth';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { userAlertStore } from '@/features/alert/stores/alert.store';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
	const router = useRouter();
	const { isAuthenticated, initializeAuth } = useAuthStore();
	const { clearAlerts } = userAlertStore()
	
	useEffect(() => {
		initializeAuth();
		clearAlerts();

		const token = getToken();
		if (token || isAuthenticated) {
			router.push(`/workspace/discovery`);
		}
	}, [clearAlerts, initializeAuth, isAuthenticated, router]);

	return <AuthLayoutWrapper>{children}</AuthLayoutWrapper>;
}