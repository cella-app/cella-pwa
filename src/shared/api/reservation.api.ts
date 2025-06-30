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

class ReservationApi extends BaseApi {

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
		try {
			const { data: responseData } = await this.apiInstance.post<{ data: UnlockResponse }>(`/reserve/${reserveId}/unlock`);

			return responseData.data.session;
		} catch (error: unknown) {
			throw this.handleApiError(error, 'getReservation', 500);
		}
	}
}

export const reservationApi = new ReservationApi();
