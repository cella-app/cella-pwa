export interface User {
	id: string;
	email: string;
	first_name: string | null;
	last_name: string | null;
	avatar: string | null;
	location: string | null;
	title: string | null;
	description: string | null;
	language: string | null;
	email_notifications: boolean;
	status: string;
	role: string;
}
