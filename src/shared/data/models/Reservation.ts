export interface Reservation {
	id: string;
	workspace_pod: string
	status: string;
	reserver: string;
	date_created: Date;
	unlock_due: Date;
	description?: string;
}
