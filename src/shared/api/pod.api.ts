import axiosInstance from './instances/axios-auth-instance';
import BaseApi from './base';
import { Pod, PodList } from "@/shared/data/models/Pod"

const TIME_DEBOUNCE_REQIEST = 500;

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
	radius: number;
}

type Resolver = (value: PodNearMeResponse | PromiseLike<PodNearMeResponse>) => void;
type Rejecter = (reason?: unknown) => void;

class PodApi extends BaseApi {
	private debounceTimer: ReturnType<typeof setTimeout> | null = null;
	private debounceResolver: { resolve: Resolver; reject: Rejecter } | null = null;
	private latestRequestData: PodNearMeRequest | null = null;

	constructor() {
		super(axiosInstance);
	}

	async getPodsNearMe(data: PodNearMeRequest): Promise<PodNearMeResponse> {
		this.latestRequestData = data;

		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer);
		}

		return new Promise((resolve, reject) => {
			this.debounceResolver = { resolve, reject };

			this.debounceTimer = setTimeout(async () => {
				try {
					if (!this.latestRequestData) {
						return;
					}
					const { data: responseData } = await this.apiInstance.post<PodNearMeResponse>('/pods', this.latestRequestData!);
					const result = {
						data: responseData.data,
						meta: responseData.meta
					};
					this.debounceResolver?.resolve(result);
				} catch (error) {
					this.debounceResolver?.reject(this.handleApiError(error, 'getPodsNearMe', 500));
				} finally {
					this.debounceTimer = null;
					this.debounceResolver = null;
					this.latestRequestData = null;
				}
			}, TIME_DEBOUNCE_REQIEST);
		});
	}

	async getPod(podId: string): Promise<Pod> {
		try {
			const { data: responseData } = await this.apiInstance.get<{ data: Pod }>(
				`/items/workspace_pods/${podId}`
			);
			return responseData.data;
		} catch (error: unknown) {
			throw this.handleApiError(error, 'getPod', 500);
		}
	}
}

export const podApi = new PodApi();
