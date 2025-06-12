import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig, AxiosHeaders } from 'axios';
import { getToken, removeToken } from '@/shared/utils/auth';

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
	(error) => {
		if (error.response?.status === 401) {
			removeToken();

			if (typeof window !== 'undefined') {
				window.location.href = '/login';
			}
		}

		return Promise.reject(error);
	}
);

export default axiosInstance;
