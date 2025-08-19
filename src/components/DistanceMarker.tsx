// src/components/DistanceMarker.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface DistanceMarkerProps {
	currentLocation: { latitude: number; longitude: number } | null;
	circleCenter: { lat: number; lng: number };
}

const DistanceMarker = ({ currentLocation, circleCenter }: DistanceMarkerProps) => {
	const [midpoint, setMidpoint] = useState<[number, number] | null>(null);
	const [distance, setDistance] = useState<number | null>(null);

	const calculateDistance = useCallback((lat1: number, lng1: number, lat2: number, lng2: number): number => {
		const R = 6371e3;
		const φ1 = lat1 * Math.PI / 180;
		const φ2 = lat2 * Math.PI / 180;
		const Δφ = (lat2 - lat1) * Math.PI / 180;
		const Δλ = (lng2 - lng1) * Math.PI / 180;

		const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
			Math.cos(φ1) * Math.cos(φ2) *
			Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

		return R * c;
	}, []);

	useEffect(() => {
		if (currentLocation) {
			const newDistance = calculateDistance(
				currentLocation.latitude,
				currentLocation.longitude,
				circleCenter.lat,
				circleCenter.lng
			);
			setDistance(newDistance);

			// Calculate midpoint
			const midLat = (currentLocation.latitude + circleCenter.lat) / 2;
			const midLng = (currentLocation.longitude + circleCenter.lng) / 2;
			setMidpoint([midLat, midLng]);
		} else {
			setDistance(null);
			setMidpoint(null);
		}
	}, [currentLocation, circleCenter, calculateDistance]);

	if (!midpoint || distance === null) {
		return null;
	}

	const distanceIcon = L.divIcon({
		className: 'distance-marker',
		html: `<div style="color: #007BFF; background-color: transparent; font-size: 16px; margin-top: 5px; width: 100px">${distance.toFixed(0)} m</div>`,
		iconSize: [50, 20],
		iconAnchor: [25, 10],
	});

	return (
		<Marker position={midpoint} icon={distanceIcon} />
	);
};

export default DistanceMarker;
