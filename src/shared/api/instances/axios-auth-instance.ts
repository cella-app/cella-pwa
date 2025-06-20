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
			originalRequest._retry = true;

			const refreshToken = getRefreshToken();

			if (!refreshToken) {
				clearAuth();
				authStore.getState().logout();
				await authApi.setCookie(null);
				return Promise.reject(error);
			}

			try {
				const { access_token: newAccessToken, refresh_token: newRefreshToken } = await authApi.refreshToken(refreshToken);
				authStore.getState().setAuth(newRefreshToken, newAccessToken);
				await authApi.setCookie(newAccessToken);

				(originalRequest.headers as AxiosHeaders).set('Authorization', `Bearer ${newAccessToken}`);

				return axiosInstance(originalRequest);
			} catch (refreshError) {
				clearAuth();
				authStore.getState().logout();
				return Promise.reject(refreshError);
			}
		}

		return Promise.reject(error);
	}
);

export default axiosInstance;
