export interface Pod {
	id: string;
	status: PodStatus;
	name: string;
	address: string;
	price_on_min: number;
}

export interface PodList {
	id: string;
	status: PodStatus;
	location: number[];
	name: string;
	price_on_min: number;
	accompanying_services: Array<AccompanyingService>;
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