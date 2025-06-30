import axiosInstance from './instances/axios-auth-instance';
import BaseApi from './base';
import { PaymentSetupIntent, PaymentMethod } from '../data/models/Payment';


export interface PaymentSetupIntentResponse {
	paymentInfo: PaymentSetupIntent
}

export interface SessionPaymentResponse {
	success: boolean;
	message: string;
}

class PaymentApi extends BaseApi {

	constructor() {
		super(axiosInstance)
	}

	async getSetupIntent(): Promise<PaymentSetupIntent> {
		try {
			const { data: responseData } = await this.apiInstance.post<{ data: PaymentSetupIntentResponse }>(
				'/payment/setup-intent'
			);
			return responseData.data.paymentInfo;
		} catch (error: unknown) {
			throw this.handleApiError(error, 'getSetupIntent', 500);
		}
	}

	async getPaymentMethod(): Promise<PaymentMethod> {
		try {
			const { data: responseData } = await this.apiInstance.get<{ data: PaymentMethod }>(
				'/items/payment_method'
			);
			return responseData.data;
		} catch (error: unknown) {
			throw this.handleApiError(error, 'getSetupIntent', 500);
		}
	}

	async processSessionPayment(sessionId: string, paymentMethodId: string): Promise<SessionPaymentResponse> {
		try {
			const { data: responseData } = await this.apiInstance.post<{ data: SessionPaymentResponse }>(
				`/payment/session/${sessionId}/process`,
				{
					payment_method_id: paymentMethodId
				}
			);
			return responseData.data;
		} catch (error: unknown) {
			throw this.handleApiError(error, 'processSessionPayment', 500);
		}
	}
}

export const paymentApi = new PaymentApi();
