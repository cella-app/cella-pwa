import axiosInstance from './instances/axios-auth-instance';
import BaseApi from './base';
import { User } from "@/shared/data/models/User"


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
}

export const meApi = new MeApi();
