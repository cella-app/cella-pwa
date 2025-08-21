import { EARTH_RADIUS_METERS } from "../config/location";

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
