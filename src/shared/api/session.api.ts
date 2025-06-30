import axiosInstance from './instances/axios-auth-instance';
import BaseApi from './base';
import { Session, SessionPause } from "@/shared/data/models/Session"

export interface SessionCurrentRunningResponse {
	session: Session;
}

export interface PauseSessionResponse {
	pauseSession: SessionPause;
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
}

export const sessionApi = new SessionApi();
