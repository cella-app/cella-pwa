import axiosInstance from './instances/axios-auth-instance';
import BaseApi from './base';
import { User } from "@/shared/data/models/User"

export interface UpdateRequest {
	first_name: string,
	last_name: string,
}

export interface UpdateAvatarRequest {
	avatar: string,
}

class MeApi extends BaseApi {

	constructor() {
		super(axiosInstance)
	}
	async get(): Promise<User> {
		try {
			const { data: responseData } = await this.apiInstance.get<{ data: User[] }>('/users');
			return responseData.data[0] ?? null;
		} catch (error: unknown) {
			throw this.handleApiError(error, 'Login failed', 500);
		}
	}

	async updateAvatar(userId: string, data: UpdateAvatarRequest): Promise<void> {
		try {
			await this.apiInstance.patch(`/users/${userId}`, data);
		} catch (error: unknown) {
			throw this.handleApiError(error, 'Update avatar failed', 500);
		}
	}

	async updateInfo(userId: string, data: UpdateRequest): Promise<void> {
		try {
			await this.apiInstance.patch(`/users/${userId}`, data);
		} catch (error: unknown) {
			throw this.handleApiError(error, 'Update info failed', 500);
		}
	}

	async delete(): Promise<void> {
		try {
			await this.apiInstance.post('/extend-users/archive');
		} catch (error: unknown) {
			throw this.handleApiError(error, 'Delete account failed', 500);
		}
	}
}

export const meApi = new MeApi();
