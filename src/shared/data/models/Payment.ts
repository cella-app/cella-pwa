export interface PaymentSetupIntent {
	client_secret: string;
}

interface CardChecks {
	address_line1_check: string | null;
	address_postal_code_check: string | null;
	cvc_check: string | null;
}

interface CardNetworks {
	available: string[];
	preferred: string | null;
}

interface ThreeDSecureUsage {
	supported: boolean;
}

interface CardWallet {
	dynamic_last4: string;
	type: string;
	[key: string]: unknown;
}

interface PaymentMethodDetail {
	brand?: string;
	checks?: CardChecks;
	country?: string;
	display_brand?: string;
	exp_month?: number;
	exp_year?: number;
	fingerprint?: string;
	funding?: string;
	generated_from?: unknown;
	last4?: string;
	networks?: CardNetworks;
	regulated_status?: string;
	three_d_secure_usage?: ThreeDSecureUsage;
	wallet?: CardWallet;
	[key: string]: unknown;
}

export interface PaymentMethod {
	brand: string;
	date_created: string | null;
	date_updated: string | null;
	detail: PaymentMethodDetail;
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
