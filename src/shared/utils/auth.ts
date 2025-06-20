import {User} from "@/shared/data/models/User"

const USER_STORAGE_KEY = 'me';
const REFRESH_TOKEN_KEY = "refreshToken";
const ACCESS_TOKEN_KEY = "authToken";

export const getToken = (): string | null => {
	if (typeof window === 'undefined') return null;
	return localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const setToken = (token: string | null): void => {
	if (typeof window === 'undefined') return;
	if (!token) {
		localStorage.removeItem(ACCESS_TOKEN_KEY);
		return;
	}
	localStorage.setItem(ACCESS_TOKEN_KEY, token ?? "");
};

export const setRefreshToken = (token: string | null): void => {
	if (typeof window === 'undefined') return;
	if (!token) {
		localStorage.removeItem(REFRESH_TOKEN_KEY);
		return;
	}
	localStorage.setItem(REFRESH_TOKEN_KEY, token ?? "");
};

export const getRefreshToken = (): string | null => {
	if (typeof window === 'undefined') return null;
	return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export const getUser = (): User | null => {
	if (typeof window === 'undefined') return null;
	const userData = localStorage.getItem(USER_STORAGE_KEY);
	return userData ? JSON.parse(userData) : null;
};

export const setUser = (user: User | null): void => {
	if (typeof window === 'undefined') return;
	if (!user) {
		localStorage.removeItem(USER_STORAGE_KEY);
		return;
	}
	localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
};

export const isLoggedIn = (): boolean => {
	if (typeof window === 'undefined') return false;
	return !!getToken();
};

export const clearAuth = (): void => {
	if (typeof window === 'undefined') return;
	localStorage.removeItem(ACCESS_TOKEN_KEY);
	localStorage.removeItem(REFRESH_TOKEN_KEY);
	localStorage.removeItem(USER_STORAGE_KEY);
};
