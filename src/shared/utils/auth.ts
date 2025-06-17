import {User} from "@/shared/data/models/User"

const USER_STORAGE_KEY = 'me';

export const getToken = (): string | null => {
	if (typeof window === 'undefined') return null;
	return localStorage.getItem('authToken');
};

export const setToken = (token: string | null): void => {
	if (typeof window === 'undefined') return;
	localStorage.setItem("authToken", token ?? "");
};

export const setRefreshToken = (token: string | null): void => {
	if (typeof window === 'undefined') return;
	localStorage.setItem("refreshToken", token ?? "");
};

export const getRefreshToken = (): string | null => {
	if (typeof window === 'undefined') return null;
	return localStorage.getItem('refreshToken');
}

export const getUser = (): User | null => {
	if (typeof window === 'undefined') return null;
	const userData = localStorage.getItem(USER_STORAGE_KEY);
	return userData ? JSON.parse(userData) : null;
};

export const setUser = (user: User): void => {
	if (typeof window === 'undefined') return;
	localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
};

export const isLoggedIn = (): boolean => {
	if (typeof window === 'undefined') return false;
	return !!getToken();
};

// Clear all auth data
export const clearAuth = (): void => {
	if (typeof window === 'undefined') return;
	localStorage.removeItem('authToken');
	localStorage.removeItem(USER_STORAGE_KEY);
};
