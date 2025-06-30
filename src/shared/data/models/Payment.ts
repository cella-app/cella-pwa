export interface PaymentSetupIntent {
	client_secret: string;
}

export interface PaymentMethod {
	pm_id: string;
	last4: string;
	exp_month: number;
	type: string
	exp_year: number;
}

export interface Billing {
	id: string;
	payer: string;
	session: string;
	amount: number;
	status: string;
	date_created: Date;
}