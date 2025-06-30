export interface Session {
	id: string;
	start_time: Date;
	latest_tracking: Date;
	end_time: Date | null;
	price_on_min: number;
	workspace_pod_reserve: string;
	workspace_pod: string;
	session_pauses: SessionPause[]
	status: SessionStatusEnum
	date_updated?: Date,
	date_created?: Date,
}

export enum SessionStatusEnum {
	ENDING = "ending",
	RUNNING = "running",
	PAUSING = "pausing",
}

export interface SessionPause {
	id: string;
	session: string;
	pause_at: Date;
	resume_at: Date | null;
}


export interface Reservation {
	id: string;
	workspace_pod: string
	status: string;
	reserver: string;
	date_created: Date;
	unlock_due: Date;
	description?: string;
}


export interface Payment {
	id: string;
	billing: string;
	payment_intent_id: string;
	amount: number;
	status: string;
	payment_method: string;
	date_created: Date;
}

export interface PaymentMethod {
	id: string;
	pm_id: string;
	user: string;
	last4: string;
}

export interface Billing {
	id: string;
	payer: string;
	session: string;
	amount: number;
	status: string;
	date_created: Date;
}