import axiosInstance from './instances/axios-auth-instance';
import BaseApi from './base';
import { Pod, PodList } from "@/shared/data/models/Pod"

const TIME_DEBOUNCE_REQIEST = 300; // Reduced from 500ms to 300ms for faster response
const CACHE_DURATION = 60000; // 1 minute cache
const MAX_CACHE_SIZE = 50; // Maximum cached responses

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

interface CacheEntry {
	data: PodNearMeResponse;
	timestamp: number;
	key: string;
}

class PodApi extends BaseApi {
	private debounceTimer: ReturnType<typeof setTimeout> | null = null;
	private debounceResolver: { resolve: Resolver; reject: Rejecter } | null = null;
	private latestRequestData: PodNearMeRequest | null = null;
	private cache: Map<string, CacheEntry> = new Map();

	constructor() {
		super(axiosInstance);
	}

	private generateCacheKey(request: PodNearMeRequest): string {
		// Round coordinates to reduce cache fragmentation while maintaining accuracy
		const lat = Math.round(request.latitude * 1000) / 1000;
		const lng = Math.round(request.longitude * 1000) / 1000;
		return `${lat},${lng},${request.radius}`;
	}

	private isValidCacheEntry(entry: CacheEntry): boolean {
		return Date.now() - entry.timestamp < CACHE_DURATION;
	}

	private cleanOldCache(): void {
		const now = Date.now();
		const keysToDelete: string[] = [];
		
		for (const [key, entry] of this.cache.entries()) {
			if (now - entry.timestamp > CACHE_DURATION) {
				keysToDelete.push(key);
			}
		}
		
		keysToDelete.forEach(key => this.cache.delete(key));
		
		// Limit cache size
		if (this.cache.size > MAX_CACHE_SIZE) {
			const sortedEntries = Array.from(this.cache.entries())
				.sort((a, b) => a[1].timestamp - b[1].timestamp);
			const toDelete = sortedEntries.slice(0, this.cache.size - MAX_CACHE_SIZE);
			toDelete.forEach(([key]) => this.cache.delete(key));
		}
	}

	private getCachedResponse(request: PodNearMeRequest): PodNearMeResponse | null {
		const key = this.generateCacheKey(request);
		const entry = this.cache.get(key);
		
		if (entry && this.isValidCacheEntry(entry)) {
			return entry.data;
		}
		
		if (entry && !this.isValidCacheEntry(entry)) {
			this.cache.delete(key);
		}
		
		return null;
	}

	private setCachedResponse(request: PodNearMeRequest, response: PodNearMeResponse): void {
		this.cleanOldCache();
		const key = this.generateCacheKey(request);
		this.cache.set(key, {
			data: response,
			timestamp: Date.now(),
			key
		});
	}

	async getPodsNearMe(data: PodNearMeRequest): Promise<PodNearMeResponse> {
		this.latestRequestData = data;

		// Check cache first for immediate response
		const cachedResponse = this.getCachedResponse(data);
		if (cachedResponse) {
			// Return cached response immediately but still update in background
			this.updateCacheInBackground(data);
			return Promise.resolve(cachedResponse);
		}

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
					
					// Cache the result
					this.setCachedResponse(this.latestRequestData, result);
					
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

	private async updateCacheInBackground(data: PodNearMeRequest): Promise<void> {
		// Update cache in background without affecting UI
		try {
			const { data: responseData } = await this.apiInstance.post<PodNearMeResponse>('/pods', data);
			const result = {
				data: responseData.data,
				meta: responseData.meta
			};
			this.setCachedResponse(data, result);
		} catch (error) {
			// Silently fail background updates
			console.warn('Background cache update failed:', error);
		}
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
