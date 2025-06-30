import axiosInstance from './instances/axios-auth-instance';
import BaseApi from './base';
import { Pod, PodList } from "@/shared/data/models/Pod"

export interface PodNearMeResponse {
	data: {
		pods: PodList[];
	},
	meta: {
		total_count: number,
		search_radius: number,
		search_coordinates: number[],
		centroid: [number, number]
	}
}

export interface PodNearMeRequest {
	longitude: number;
	latitude: number;
	radius: number
}

class PodApi extends BaseApi {

	constructor() {
		super(axiosInstance)
	}

	async getPodsNearMe(data: PodNearMeRequest): Promise<PodNearMeResponse> {
		try {
			const { data: responseData } = await this.apiInstance.post<PodNearMeResponse>('/pods', data);
			const result: PodNearMeResponse = {
				data: responseData.data,
				meta: responseData.meta
			}
			return result
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

	// async reversePod(podId: string): Promise<Pod> {
		
	// }
}

export const podApi = new PodApi();
