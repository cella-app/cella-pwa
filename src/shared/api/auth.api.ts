import axiosInstance from './instances/axios-normal-instance';
import BaseApi from './base';
import { AxiosInstance } from 'axios';
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

class AuthApi extends BaseApi {

	apiInstance: AxiosInstance = axiosInstance;

	// Login
	async login(data: LoginRequest): Promise<AuthResponse> {
		try {
			const response = await this.apiInstance.post<AuthResponse>('/auth/login', data);
			return response.data;
		} catch (error: unknown) {
			throw this.handleApiError(error, 'Login failed', 500);
		}
	}

	// Register
	async register(data: RegisterRequest): Promise<AuthResponse> {
		try {
			const response = await this.apiInstance.post<AuthResponse>('/auth/register', data);
			return response.data;
		} catch (error: unknown) {
			throw this.handleApiError(error, 'Registration failed', 500);
		}
	}

	// Logout (if needed to call API)
	async logout(): Promise<void> {
		try {
			await this.apiInstance.post('/auth/logout');
		} catch (error: unknown) {
			// Ignore logout errors, clear local storage anyway
			console.warn('Logout API call failed:', error);
		}
	}

	// Get current user profile
	async getProfile(): Promise<User> {
		try {
			const response = await this.apiInstance.get<User>('/auth/profile');
			return response.data;
		} catch (error: unknown) {
			throw this.handleApiError(error, 'Failed to get profile', 500);
		}
	}

	// Refresh token
	async refreshToken(): Promise<AuthResponse> {
		try {
			const response = await this.apiInstance.post<AuthResponse>('/auth/refresh');
			return response.data;
		} catch (error: unknown) {
			throw this.handleApiError(error, 'Token refresh failed', 500);
		}
	}

	// Verify token
	async verifyToken(): Promise<boolean> {
		try {
			await this.apiInstance.get('/auth/verify');
			return true;
		} catch {
			return false;
		}
	}
}

export const authApi = new AuthApi();
