'use client';

import { useEffect, useState, useRef } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { CircleSmall as ICircle } from 'lucide-react';

import { renderToString } from 'react-dom/server';
import { Circle } from 'react-leaflet';
import { useRadiusStore } from '@/features/pods/stores/radius.store';
import { useMapStore } from '@/features/map/stores/map.store';

const CenterMapControl = () => {
	const map = useMap();
	const centerMarkerRef = useRef<L.Marker | null>(null);
	const { radius } = useRadiusStore();
	const { setCurrentMapCenter, currentMapCenter } = useMapStore();

	// Sử dụng searchCenter thay vì map center
	const [circleCenter, setCircleCenter] = useState(() => {
		return currentMapCenter ?
			L.latLng(currentMapCenter.latitude, currentMapCenter.longitude) :
			map.getCenter();
	});

	// Cập nhật marker khi searchCenter thay đổi
	useEffect(() => {
		if (currentMapCenter) {
			const newCenter = L.latLng(currentMapCenter.latitude, currentMapCenter.longitude);
			setCircleCenter(newCenter);

			// Cập nhật marker position
			if (centerMarkerRef.current) {
				centerMarkerRef.current.setLatLng(newCenter);
			}
		}
	}, [currentMapCenter]);

	useEffect(() => {
		// Khởi tạo marker với searchCenter hoặc map center
		const initialCenter = currentMapCenter ?
			L.latLng(currentMapCenter.latitude, currentMapCenter.longitude) :
			map.getCenter();

		centerMarkerRef.current = L.marker(initialCenter, {
			icon: L.divIcon({
				html: renderToString(<ICircle size={24} color="#007BFF" />),
				className: 'center-map-icon',
				iconSize: [24, 24],
				iconAnchor: [12, 12],
			}),
			zIndexOffset: 1000,
		}).addTo(map);

		return () => {
			if (centerMarkerRef.current) {
				map.removeLayer(centerMarkerRef.current);
			}
		};
	}, [map]);

	useMapEvents({
		move: () => {
			// Cập nhật map center trong store khi user di chuyển map
			const newCenter = map.getCenter();
			const newMapCenter = {
				latitude: newCenter.lat,
				longitude: newCenter.lng
			};

			// Lưu map center mới vào store
			// Điều này sẽ trigger logic trong useLocationTracking
			setCurrentMapCenter(newMapCenter);

			// Cập nhật UI immediately (sẽ được override bởi searchCenter nếu cần)
			centerMarkerRef.current?.setLatLng(newCenter);
			setCircleCenter(newCenter);
		},
	});

	return (
		<>
			<Circle
				center={circleCenter}
				radius={radius}
				pathOptions={{
					color: 'transparent',
					fillColor: '#007BFF',
					fillOpacity: 0.2,
				}}
			/>
		</>
	);
};

export default CenterMapControl;