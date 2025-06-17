"use client";

import { useAuthStore } from './stores/auth.store';
import { authApi } from '@/shared/api/auth.api';
import { meApi } from '@/shared/api/me.api';

export async function loginAction(email: string, password: string) {
	const { setAuth, setLoading, setError, setUser } = useAuthStore.getState();

	setLoading(true);
	setError(null);

	try {
		const data = await authApi.login({ email, password });
		
		if (!data.access_token) {
			throw new Error('No token received');
		}

		await authApi.setCookie(data.access_token);

		setAuth(data.refresh_token, data.access_token);
		
		setTimeout(async () => {
			const user = await meApi.get();
			setUser(user)
		}, 1500)
	
	} catch (err) {
		setError(err instanceof Error ? err.message : 'Login failed');
		throw err;
	} finally {
		setLoading(false);
	}
}

import { useRouter } from 'next/navigation';
type NextRouter = ReturnType<typeof useRouter>;

export async function registerAction(email: string, password: string, router: NextRouter) {
	const { setLoading, setError } = useAuthStore.getState();


	setLoading(true);
	setError(null);

	try {
		await authApi.register({ email, password });
		router.push('/auth/login');
	} catch (err) {
		setError(err instanceof Error ? err.message : 'Registration failed');
		throw err;
	} finally {
		setLoading(false);
	}
}

export async function logOutAction() {
	const { setAuth, setError } = useAuthStore.getState();

	setError(null);
	try {
		// 1. Gọi API logout
		await authApi.logout();
		
		// 2. Xóa cookie
		await authApi.setCookie(null);
		
		// 3. Reset auth state
		setAuth(null, null);
	} catch(err) {
		setError(err instanceof Error ? err.message : 'Logout failed');
		throw err;
	}
}
