import axiosInstance from './instances/axios-normal-instance';
import BaseApi from './base';
import { User } from "@/shared/data/models/User"

interface AuthResponse {
	expires: number;
	refresh_token: string;
	access_token: string;
}
interface LoginRequest {
	email: string;
	password: string;
}

interface RegisterRequest {
	email: string;
	password: string;
}

class AuthApi extends BaseApi {

	constructor() {
		super(axiosInstance)
	}
	// Login
	async login(data: LoginRequest): Promise<AuthResponse> {
		try {
			const { data: responseData } = await this.apiInstance.post<{ data: AuthResponse }>('/auth/login', data);
			return responseData.data;
		} catch (error: unknown) {
			throw this.handleApiError(error, 'Login failed', 500);
		}
	}

	// Register
	async register(data: RegisterRequest): Promise<AuthResponse> {
		try {
			const { data: responseData } = await this.apiInstance.post<{ data: AuthResponse }>('/users/register', data);
			return responseData.data;
		} catch (error: unknown) {
			throw this.handleApiError(error, 'Registration failed', 500);
		}
	}

	// Logout (if needed to call API)
	async logout(refreshToken: string): Promise<void> {
		try {
			await this.apiInstance.post('auth/logout', {
				refresh_token: refreshToken
			});

		} catch (error: unknown) {
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
	async refreshToken(refreshToken: string): Promise<AuthResponse> {
		try {
			const { data: responseData } = await this.apiInstance.post<{ data: AuthResponse }>('/auth/refresh', {
				refresh_token: refreshToken,
			});
			return responseData.data;
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

	async setCookie(token: string | null) {
		const response = await fetch('/api/auth/set-cookie', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ token })
		});
		return response.json();
	}
}

export const authApi = new AuthApi();
