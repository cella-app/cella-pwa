import {User} from "@/shared/data/models/User"

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

// Token management
export const getToken = (): string | null => {
	if (typeof window === 'undefined') return null;
	return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string): void => {
	if (typeof window === 'undefined') return;
	localStorage.setItem(TOKEN_KEY, token);
};

export const removeToken = (): void => {
	if (typeof window === 'undefined') return;
	localStorage.removeItem(TOKEN_KEY);
	localStorage.removeItem(USER_KEY);
};

// User management
export const getUser = (): User | null => {
	if (typeof window === 'undefined') return null;
	const userStr = localStorage.getItem(USER_KEY);
	return userStr ? JSON.parse(userStr) : null;
};

export const setUser = (user: User): void => {
	if (typeof window === 'undefined') return;
	localStorage.setItem(USER_KEY, JSON.stringify(user));
};

// Auth status check
export const isLoggedIn = (): boolean => {
	return !!getToken();
};

// Clear all auth data
export const clearAuth = (): void => {
	removeToken();
};

export const requireAuth = (): boolean => {
	const token = getToken();
	return !!token;
};
