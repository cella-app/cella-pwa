"use server";
// auth.actions.ts
import { setToken, setUser, clearAuth } from '@/shared/utils/auth';
import { useAuthStore } from './stores/auth.store';
import { authApi, LoginRequest, RegisterRequest } from '@/shared/api/auth.api';

export async function loginAction(email: string, password: string) {
	const { setAuth, setLoading, setError } = useAuthStore.getState();

	setLoading(true);
	setError(null);

	try {
		const { token, user } = await authApi.login({
			email,
			password
		} as LoginRequest)
		

		setToken(token);
		setUser(user);

		setAuth(user, token);
	} catch (err) {
		setError(err instanceof Error ? err.message : 'Login failed');
		throw err;
	} finally {
		setLoading(false);
	}
}

export async function registerAction(email: string, password: string) {
	const { setAuth, setLoading, setError } = useAuthStore.getState();

	setLoading(true);
	setError(null);

	try {
		const { token, user } = await authApi.register({
			email,
			password
		} as RegisterRequest)

		setToken(token);
		setUser(user);

		setAuth(user, token);
	} catch (err) {
		setError(err instanceof Error ? err.message : 'Registration failed');
		throw err;
	} finally {
		setLoading(false);
	}
}

export async function logOutAction() {
	const { logout, setError } = useAuthStore.getState();

	setError(null);
	try {
		clearAuth();
		logout();
	} catch(err) {
		setError(err instanceof Error ? err.message : 'Registration failed');
		throw err;
	}
}
