"use client";

import { useAuthStore } from './stores/auth.store';
import { authApi } from '@/shared/api/auth.api';
import { meApi } from '@/shared/api/me.api';
import { clearAuth, getRefreshToken } from '@/shared/utils/auth';

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
		setTimeout(() => {
			router.push('/auth/login');
		}, 1500)
	} catch (err) {
		setError(err instanceof Error ? err.message : 'Registration failed');
		throw err;
	} finally {
		setLoading(false);
	}
}

export async function logOutAction(router: NextRouter) {
	const { setAuth, setError, setUser } = useAuthStore.getState();

	setError(null);
	try {
		const refreshToken = getRefreshToken()
		if (refreshToken) {
			await authApi.logout(refreshToken);
		}
		
		await authApi.setCookie(null);
		
		setAuth(null, null);
		setUser(null);
		clearAuth();
		setTimeout(() => {
			router.push('/auth/login');
		})
	} catch(err) {
		setError(err instanceof Error ? err.message : 'Logout failed');
		throw err;
	}
}
