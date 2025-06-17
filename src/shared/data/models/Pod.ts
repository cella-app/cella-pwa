export interface Pod {
	id: string;
	status: PodStatus;
	name: string;
	address: string;
	accompanying_services: Array<AccompanyingService>;
	price_on_min: number;
}

export interface PodList {
	id: string;
	status: PodStatus;
	location: number[];
	name: string;
	distance_meters: number;
}

export enum PodStatus {
	available = "available",
	unavailable = "unavailable",
	close = "close"
}

export interface AccompanyingService {
	id: string;
	icon_key: string;
	description?: string;
}