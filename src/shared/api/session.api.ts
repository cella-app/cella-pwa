import axiosInstance from './instances/axios-auth-instance';
import BaseApi from './base';
import { Session, SessionPause, BillingSession, BillingSummarySession, SessionAmount } from "@/shared/data/models/Session"

export interface SessionCurrentRunningResponse {
	session: Session;
}

export interface PauseSessionResponse {
	pauseSession: SessionPause;
}


export interface PauseSessionsResponse {
	pauseLogs: SessionPause[];
}

export interface BillingResponse {
	billing: BillingSession;
}


export interface BillingSummaryResponse {
	billingSummary: BillingSummarySession;
}

class SessionApi extends BaseApi {

	constructor() {
		super(axiosInstance)
	}

	async getCurrentRunningSession(): Promise<Session> {
		try {
			const { data: responseData } = await this.apiInstance.get<{ data: SessionCurrentRunningResponse }>(`/reserve/session/current-running`);

			return responseData.data.session;
		} catch (error: unknown) {
			throw this.handleApiError(error, 'getSession', 500);
		}
	}

	async getSessionById(sessionId: string): Promise<Session> {
		try {
			const { data: responseData } = await this.apiInstance.get<{ data: SessionCurrentRunningResponse }>(`/reserve/session/${sessionId}`);

			return responseData.data.session;
		} catch (error: unknown) {
			throw this.handleApiError(error, 'getSessionById', 500);
		}
	}

	async trackingSession(sessionId: string): Promise<null> {
		try {
			await this.apiInstance.post(`/reserve/session/${sessionId}/tracking`);
			return null;
		} catch (error: unknown) {
			throw this.handleApiError(error, 'getSession', 500);
		}
	}

	async endSession(sessionId: string): Promise<Session> {
		try {
			const { data: responseData } = await this.apiInstance.post<{ data: SessionCurrentRunningResponse }>(`/reserve/session/${sessionId}/end`);
			return responseData.data.session;
		} catch (error: unknown) {
			throw this.handleApiError(error, 'getSession', 500);
		}
	}

	async pauseSession(sessionId: string): Promise<Session> {
		try {
			const { data: responseData } = await this.apiInstance.post<{ data: SessionCurrentRunningResponse }>(`/reserve/session/${sessionId}/pause`);

			return responseData.data.session;
		} catch (error: unknown) {
			throw this.handleApiError(error, 'getSession', 500);
		}
	}

	async resumeSession(sessionId: string): Promise<Session> {
		try {
			const { data: responseData } = await this.apiInstance.post<{ data: SessionCurrentRunningResponse }>(`/reserve/session/${sessionId}/resume`);
			return responseData.data.session;
		} catch (error: unknown) {
			throw this.handleApiError(error, 'getSession', 500);
		}
	}

	async getPauseLogs(sessionId: string): Promise<SessionPause[]> {
		try {
			const { data: responseData } = await this.apiInstance.get<{ data: PauseSessionsResponse }>(`/reserve/session/${sessionId}/pause-logs`);
			return responseData.data.pauseLogs;
		} catch (error: unknown) {
			console.warn('Failed to get pause logs, returning empty array:', error);
			return [];
		}
	}

	async getCurrentPause(sessionId: string): Promise<SessionPause | null> {
		try {
			const { data: responseData } = await this.apiInstance.get<{ data: PauseSessionResponse }>(`/reserve/session/${sessionId}/current-pause`);
			return responseData.data.pauseSession;
		} catch (error: unknown) {
			console.warn('Failed to get current pause, returning null:', error);
			return null;
		}
	}

	async getBilling(sessionId: string): Promise<BillingSession | null> {
		try {
			const { data: responseData } = await this.apiInstance.get<{ data: BillingResponse }>(`/reserve/session/${sessionId}/billing`);
			return responseData.data.billing;
		} catch (error: unknown) {
			console.warn('Failed to get current pause, returning null:', error);
			return null;
		}
	}

	async getBillingSummary(sessionId: string): Promise<BillingSummarySession | null> {
		try {
			const { data: responseData } = await this.apiInstance.get<{ data: BillingSummaryResponse }>(`/reserve/session/${sessionId}/billing-summary`);
			return responseData.data.billingSummary;
		} catch (error: unknown) {
			console.warn('Failed to get current pause, returning null:', error);
			return null;
		}
	}

	async getAmount(sessionId: string): Promise<number | null> {
		try {
			const { data: responseData } = await this.apiInstance.get<{ data: SessionAmount }>(`/reserve/session/${sessionId}/amount`);
			return responseData.data.amount;
		} catch (error: unknown) {
			console.warn('Failed to get current pause, returning null:', error);
			return null;
		}
	}
}

export const sessionApi = new SessionApi();
