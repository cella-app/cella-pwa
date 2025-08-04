import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig, AxiosHeaders } from 'axios';
import { getToken, clearAuth, getRefreshToken } from '@/shared/utils/auth';
import { ENV } from '@/shared/config/env';
import { authApi } from '@/shared/api/auth.api';
import { useAuthStore } from '@/features/auth/stores/auth.store';

const authStore = {
	getState: useAuthStore.getState,
	setState: useAuthStore.setState,
	subscribe: useAuthStore.subscribe,
};

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
	_retry?: boolean;
}

// Quản lý refresh token state
let isRefreshing = false;
let failedQueue: Array<{
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	resolve: (value?: any) => void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	reject: (reason?: any) => void;
}> = [];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const processQueue = (error: any, token: string | null = null) => {
	failedQueue.forEach(({ resolve, reject }) => {
		if (error) {
			reject(error);
		} else {
			resolve(token);
		}
	});

	failedQueue = [];
};

const axiosInstance: AxiosInstance = axios.create({
	baseURL: ENV.API_URL,
	timeout: 10000,
	headers: {
		'Content-Type': 'application/json',
	},
	withCredentials: true
});

axiosInstance.interceptors.request.use(
	(config) => {
		const token = getToken();
		const internalConfig = config as InternalAxiosRequestConfig;

		if (token && internalConfig.headers) {
			internalConfig.headers = new AxiosHeaders({
				...internalConfig.headers,
				Authorization: `Bearer ${token}`,
			});
		}

		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);

axiosInstance.interceptors.response.use(
	(response: AxiosResponse) => response,
	async (error) => {
		const originalRequest = error.config as CustomAxiosRequestConfig;

		if (typeof originalRequest._retry === 'undefined') {
			originalRequest._retry = false;
		}

		if (error.response?.status === 401 && !originalRequest._retry) {
			if (isRefreshing) {
				console.log('🔄 Queuing request while refreshing token');
				return new Promise((resolve, reject) => {
					failedQueue.push({ resolve, reject });
				}).then(token => {
					if (token) {
						originalRequest.headers = originalRequest.headers || {};
						(originalRequest.headers as AxiosHeaders).set('Authorization', `Bearer ${token}`);
					}
					return axiosInstance(originalRequest);
				}).catch(err => {
					return Promise.reject(err);
				});
			}

			originalRequest._retry = true;
			isRefreshing = true;

			console.log('🚀 Starting token refresh process');

			const refreshToken = getRefreshToken();
			if (!refreshToken) {
				console.log('❌ No refresh token found, logging out');
				processQueue(error, null);
				isRefreshing = false;
				clearAuth();
				authStore.getState().logout();
				await authApi.setCookie(null);
				return Promise.reject(error);
			}

			try {
				console.log('🔑 Attempting to refresh token');
				const { access_token: newAccessToken, refresh_token: newRefreshToken } =
					await authApi.refreshToken(refreshToken);

				console.log('✅ Token refresh successful');
				console.log('newAccessToken:', newAccessToken);
				console.log('newRefreshToken:', newRefreshToken);

				// Update auth state
				authStore.getState().setAuth(newRefreshToken, newAccessToken);
				await authApi.setCookie(newAccessToken);

				// Process all queued requests
				processQueue(null, newAccessToken);
				isRefreshing = false;

				// Retry original request
				(originalRequest.headers as AxiosHeaders).set('Authorization', `Bearer ${newAccessToken}`);
				return axiosInstance(originalRequest);

			} catch (refreshError) {
				console.log('❌ Token refresh failed:', refreshError);
				processQueue(refreshError, null);
				isRefreshing = false;
				clearAuth();
				authStore.getState().logout();
				await authApi.setCookie(null);
				return Promise.reject(refreshError);
			}
		}

		return Promise.reject(error);
	}
);

export default axiosInstance;