import axios from 'axios';
import axiosInstance from './axios-instance';
import { User } from "@/shared/data/models/User"

export interface LoginRequest {
	email: string;
	password: string;
}

export interface RegisterRequest {
	email: string;
	password: string;
}

export interface AuthResponse {
	token: string;
	user: User;
	message?: string;
}

export interface ApiError {
	message: string;
	status: number;
}

class AuthApi {
	// Login
	async login(data: LoginRequest): Promise<AuthResponse> {
		try {
			const response = await axiosInstance.post<AuthResponse>('/auth/login', data);
			return response.data;
		} catch (error: unknown) {
			let message = 'Login failed';
			let status = 500;

			if (axios.isAxiosError(error)) {
				message = error.response?.data?.message || message;
				status = error.response?.status || status;
			} else if (error instanceof Error) {
				message = error.message;
			}

			throw {
				message,
				status,
			} as ApiError;
		}
	}

	// Register
	async register(data: RegisterRequest): Promise<AuthResponse> {
		try {
			const response = await axiosInstance.post<AuthResponse>('/auth/register', data);
			return response.data;
		} catch (error: unknown) {
			let message = 'Registration failed';
			let status = 500;

			if (axios.isAxiosError(error)) {
				message = error.response?.data?.message || message;
				status = error.response?.status || status;
			} else if (error instanceof Error) {
				message = error.message;
			}

			throw {
				message,
				status,
			} as ApiError;
		}
	}

	// Logout (if needed to call API)
	async logout(): Promise<void> {
		try {
			await axiosInstance.post('/auth/logout');
		} catch (error: unknown) {
			// Ignore logout errors, clear local storage anyway
			console.warn('Logout API call failed:', error);
		}
	}

	// Get current user profile
	async getProfile(): Promise<User> {
		try {
			const response = await axiosInstance.get<User>('/auth/profile');
			return response.data;
		} catch (error: unknown) {
			let message = 'Failed to get profile';
			let status = 500;

			if (axios.isAxiosError(error)) {
				message = error.response?.data?.message || message;
				status = error.response?.status || status;
			} else if (error instanceof Error) {
				message = error.message;
			}

			throw {
				message,
				status,
			} as ApiError;
		}
	}

	// Refresh token
	async refreshToken(): Promise<AuthResponse> {
		try {
			const response = await axiosInstance.post<AuthResponse>('/auth/refresh');
			return response.data;
		} catch (error: unknown) {
			let message = 'Token refresh failed';
			let status = 500;

			if (axios.isAxiosError(error)) {
				message = error.response?.data?.message || message;
				status = error.response?.status || status;
			} else if (error instanceof Error) {
				message = error.message;
			}

			throw {
				message,
				status,
			} as ApiError;
		}
	}

	// Verify token
	async verifyToken(): Promise<boolean> {
		try {
			await axiosInstance.get('/auth/verify');
			return true;
		} catch {
			return false;
		}
	}
}

export const authApi = new AuthApi();
