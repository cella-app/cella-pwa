export interface PaymentSetupIntent {
	client_secret: string;
}

export interface PaymentMethod {
	brand: string;
	date_created: string | null;
	date_updated: string | null;
	detail: Record<string, any>;
	exp_month: number;
	exp_year: number;
	id: string;
	last4: string;
	pm_id: string;
	type: string;
	user: string;
}

export interface Billing {
	id: string;
	payer: string;
	session: string;
	amount: number;
	status: string;
	date_created: Date;
}