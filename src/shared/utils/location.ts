import { EARTH_RADIUS_METERS } from "../config/location";
import { LocationData } from "../data/models/Location";

export const calculateDistance = (
	lat1: number,
	lng1: number,
	lat2: number,
	lng2: number
): number => {
	const lat1Rad = (lat1 * Math.PI) / 180;
	const lat2Rad = (lat2 * Math.PI) / 180;
	const latDiff = ((lat2 - lat1) * Math.PI) / 180;
	const lngDiff = ((lng2 - lng1) * Math.PI) / 180;
	const a =
		Math.sin(latDiff / 2) ** 2 +
		Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(lngDiff / 2) ** 2;
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return EARTH_RADIUS_METERS * c;
};

export const calculateDistanceNew = (point1: LocationData, point2: LocationData): number => {
	const lat1Rad = (point1.latitude * Math.PI) / 180;
	const lat2Rad = (point2.latitude * Math.PI) / 180;
	const latDiff = ((point2.latitude - point1.latitude) * Math.PI) / 180;
	const lngDiff = ((point2.longitude - point1.longitude) * Math.PI) / 180;
	const a =
		Math.sin(latDiff / 2) ** 2 +
		Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(lngDiff / 2) ** 2;
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return EARTH_RADIUS_METERS * c;
};


export const getAllowedToGetPodsThreshold = (radius: number): number => {
	if (radius <= 600) return 50;
	if (radius <= 1000) return 100;
	if (radius <= 2500) return 150;
	if (radius <= 5000) return 300;
	if (radius <= 20000) return 1000;
	return 1200;
};

export const getAllowedCenterThreshold = (radius: number): number => {
	if (radius <= 600) return 300;
	if (radius <= 1000) return 500;
	if (radius <= 2500) return 1250;
	if (radius <= 5000) return 2500;
	if (radius <= 20000) return 10000;
	return 12000;
};