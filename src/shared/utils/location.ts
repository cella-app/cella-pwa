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
	if (radius <= 1200) return 100;  // Doubled from 600→50 to 1200→100
	if (radius <= 2000) return 200;  // Doubled from 1000→100 to 2000→200
	if (radius <= 5000) return 300;  // Doubled from 2500→150 to 5000→300
	if (radius <= 10000) return 600; // Doubled from 5000→300 to 10000→600
	if (radius <= 20000) return 1000; // Keep max the same
	return 1200;
};

export const getAllowedCenterThreshold = (radius: number): number => {
	if (radius <= 1200) return 200;  // Doubled from 600→100 to 1200→200
	if (radius <= 2000) return 400;  // Doubled from 1000→200 to 2000→400
	if (radius <= 5000) return 600;  // Doubled from 2500→300 to 5000→600
	if (radius <= 10000) return 800; // Doubled from 5000→400 to 10000→800
	if (radius <= 20000) return 1000; // Keep max the same
	return 1000;
};


export const getNoiseThreshold = (radius: number): number => {
	if (radius <= 1200) return 20;  // Doubled from 600→10 to 1200→20
	if (radius <= 2000) return 40;  // Doubled from 1000→20 to 2000→40
	if (radius <= 5000) return 60;  // Doubled from 2500→30 to 5000→60
	if (radius <= 10000) return 80; // Doubled from 5000→40 to 10000→80
	if (radius <= 20000) return 100; // Keep max the same
	return 100;
}