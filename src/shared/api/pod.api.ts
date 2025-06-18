import axiosInstance from './instances/axios-auth-instance';
import BaseApi from './base';
import { AxiosInstance } from 'axios';
import { Pod, PodList } from "@/shared/data/models/Pod"

export interface PodNearMeResponse {
	pods: PodList[];
}

export interface PodNearMeRequest {
	longitude: number;
	latitude: number;
	radius: number
}

class PodApi extends BaseApi {

	apiInstance: AxiosInstance = axiosInstance;

	async getPodsNearMe(data: PodNearMeRequest): Promise<PodNearMeResponse> {
		try {
			const { data: responseData } = await this.apiInstance.post<{ data: PodNearMeResponse }>('/pods', data);
			return responseData.data;
		} catch (error: unknown) {
			throw this.handleApiError(error, 'getPodsNearMe', 500);
		}
	}

	async getPod(podId: string): Promise<Pod> {
		try {
			const { data: responseData } = await this.apiInstance.get<{ data: Pod }>(`/items/workspace_pods/${podId}`);

			return responseData.data;
		} catch (error: unknown) {
			throw this.handleApiError(error, 'getPod', 500);
		}
	}
}

export const podApi = new PodApi();
