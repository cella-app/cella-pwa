import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig, AxiosHeaders } from 'axios';
import { getToken, clearAuth } from '@/shared/utils/auth';

import { useAuthStore } from '@/features/auth/stores/auth.store';

const axiosInstance: AxiosInstance = axios.create({
	baseURL: process.env.NODE_ENV === 'development'
		? 'http://localhost:3000/api'
		: '/api',
	timeout: 10000,
	headers: {
		'Content-Type': 'application/json',
	},
});

axiosInstance.interceptors.request.use(
	(config) => {
		const token = getToken();
		const internalConfig = config as unknown as InternalAxiosRequestConfig;
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
	(response: AxiosResponse) => {
		return response;
	},
	async (error) => {
		const { user, logout } = useAuthStore();

		const originalRequest = error.config;

		if (
			error.response?.status === 401 && 
			!originalRequest._retry
		) {
			originalRequest._retry = true;

			if (!user) {
				clearAuth();
				logout();
				return Promise.reject(error);
			}

			try {
				const newToken = getToken();
				originalRequest.headers.Authorization = `Bearer ${newToken}`;
				return axiosInstance.request(originalRequest);
			} catch (err) {
				clearAuth();
				logout();
				return Promise.reject(err);
			}
		}

		return Promise.reject(error);
	}
);

export default axiosInstance;
