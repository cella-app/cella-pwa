"use client";

import { useAuthStore } from './stores/auth.store';
import { authApi } from '@/shared/api/auth.api';
import { meApi } from '@/shared/api/me.api';
import { clearAuth, getRefreshToken } from '@/shared/utils/auth';
import { userAlertStore, SERVERIFY_ALERT } from '@/features/alert/stores/alert.store';

export async function loginAction(email: string, password: string) {
	const { setAuth, setLoading, setError, setUser, isAuthenticated } = useAuthStore.getState();
	const { addAlert } = userAlertStore.getState();

	setLoading(true);
	setError(null);

	try {
		const data = await authApi.login({ email, password });
		
		if (!data.access_token) {
			throw new Error('No token received');
		}

		await authApi.setCookie(data.access_token);

		setAuth(data.refresh_token, data.access_token);
		
		addAlert({
			severity: SERVERIFY_ALERT.SUCCESS,
			message: "Login successfully!"
		})


		console.warn("isAuthenticated", isAuthenticated)
    
    const user = await meApi.get();
    setUser(user)
    // setTimeout(async () => {
		// 	const user = await meApi.get();
		// 	setUser(user)
		// }, 500)
	} catch (err) {
		setError(err instanceof Error ? err.message : 'Login failed');
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		//@ts-ignore
		if (401 == err?.status) {
			addAlert({
				severity: SERVERIFY_ALERT.ERROR,
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				//@ts-ignore
				message: "Incorrect email or password"
			});
		} else {
			addAlert({
				severity: SERVERIFY_ALERT.ERROR,
				message: err instanceof Error ? err.message : 'An unknown error occurred',
			});
		}
		throw err;
	} finally {
		setLoading(false);
	}
}

import { useRouter } from 'next/navigation';
type NextRouter = ReturnType<typeof useRouter>;

export async function registerAction(email: string, password: string, router: NextRouter) {
	const { setLoading, setError } = useAuthStore.getState();
	const { addAlert } = userAlertStore.getState();


	setLoading(true);
	setError(null);

	try {
		await authApi.register({ email, password });
		setTimeout(() => {
			router.push('/auth/login');
		}, 1500)
	} catch (err) {
		setError(err instanceof Error ? err.message : 'Registration failed');
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		//@ts-ignore
		if (400 == err?.status) {
			addAlert({
				severity: SERVERIFY_ALERT.ERROR,
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				//@ts-ignore
				message: err.message
			});
		} else {
			addAlert({
				severity: SERVERIFY_ALERT.ERROR,
				message: err instanceof Error ? err.message : 'An unknown error occurred',
			});
		}
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
