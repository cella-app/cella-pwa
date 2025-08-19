import axiosInstance from './instances/axios-auth-instance';
import BaseApi from './base';
import { Reservation } from "@/shared/data/models/Reservation"
import { Session } from '../data/models/Session';

export interface ReservationCurrentRunningResponse {
	reserve: Reservation;
}

export interface UnlockResponse {
	session: Session
}

const TIME_DEBOUNCE_REQIEST = 500;

type UnlockResolver = (value: Session | PromiseLike<Session>) => void;
type UnlockRejecter = (reason?: unknown) => void;

class ReservationApi extends BaseApi {
	private debounceTimer: ReturnType<typeof setTimeout> | null = null;
	private debounceResolver: { resolve: UnlockResolver; reject: UnlockRejecter } | null = null;
	private latestRequestData: string | null = null; // For unlock, it's reserveId

	constructor() {
		super(axiosInstance)
	}

	async getCurrentReserve(): Promise<Reservation> {
		try {
			const { data: responseData } = await this.apiInstance.get<{ data: ReservationCurrentRunningResponse }>(`/reserve/waiting`);

			return responseData.data.reserve;
		} catch (error: unknown) {
			throw this.handleApiError(error, 'getReservation', 500);
		}
	}

	async reserve(workspaceId: string): Promise<Reservation> {
		try {
			const { data: responseData } = await this.apiInstance.post<{ data: ReservationCurrentRunningResponse }>(`/reserve`, {
				workspaceId
			});

			return responseData.data.reserve;
		} catch (error: unknown) {
			throw this.handleApiError(error, 'getReservation', 500);
		}
	}

	async cancel(reserveId: string): Promise<null> {
		try {
			const { data: responseData } = await this.apiInstance.post<{ data: null }>(`/reserve/${reserveId}/cancel`);

			return responseData.data;
		} catch (error: unknown) {
			throw this.handleApiError(error, 'getReservation', 500);
		}
	}

	async unlock(reserveId: string): Promise<Session> {
		this.latestRequestData = reserveId;

		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer);
		}

		return new Promise((resolve, reject) => {
			this.debounceResolver = { resolve, reject };

			this.debounceTimer = setTimeout(async () => {
				try {
					const { data: responseData } = await this.apiInstance.post<{ data: UnlockResponse }>(`/reserve/${this.latestRequestData}/unlock`);
					const result = responseData.data.session;
					this.debounceResolver?.resolve(result);
				} catch (error) {
					this.debounceResolver?.reject(this.handleApiError(error, 'unlock', 500));
				} finally {
					this.debounceTimer = null;
					this.debounceResolver = null;
					this.latestRequestData = null;
				}
			}, TIME_DEBOUNCE_REQIEST);
		});
	}

	async feeback(reserveId: string, star: number, content: string | null): Promise<null> {
		try {
			const { data: responseData } = await this.apiInstance.post<{ data: null }>(`/reserve/${reserveId}/feedback`, {
				star,
				content
			});

			return responseData.data;
		} catch (error: unknown) {
			throw this.handleApiError(error, 'getReservation', 500);
		}
	}
}

export const reservationApi = new ReservationApi();
