'use client';

import { useEffect, useState, useRef } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Circle } from 'react-leaflet';
import { useRadiusStore } from '@/features/map/stores/radius.store';
import { useMapStore } from '@/features/map/stores/map.store';
import { useLocationTrackingContext } from '@/hooks/LocationTrackingContext';

const CenterMapControl = () => {
	const map = useMap();
	const centerMarkerRef = useRef<L.Marker | null>(null);
	const { radius } = useRadiusStore();
	const { currentMapCenter } = useMapStore();
	const { loading } = useLocationTrackingContext();

	// Tọa độ trung tâm
	const [circleCenter, setCircleCenter] = useState(() => {
		return currentMapCenter
			? L.latLng(currentMapCenter.latitude, currentMapCenter.longitude)
			: map.getCenter();
	});

	// Radar pulse state (0 → 1)
	const [pulse, setPulse] = useState(0);

	useEffect(() => {
		let t = 0;
		const interval = setInterval(() => {
			t = (t + 0.02) % 1;
			setPulse(t);
		}, 50);
		return () => clearInterval(interval);
	}, []);

	// Cập nhật marker khi center thay đổi
	useEffect(() => {
		if (currentMapCenter) {
			const newCenter = L.latLng(
				currentMapCenter.latitude,
				currentMapCenter.longitude
			);
			setCircleCenter(newCenter);
			if (centerMarkerRef.current) {
				centerMarkerRef.current.setLatLng(newCenter);
			}
		}
	}, [currentMapCenter]);

	// Khởi tạo marker trung tâm
	useEffect(() => {
		const initialCenter = currentMapCenter
			? L.latLng(currentMapCenter.latitude, currentMapCenter.longitude)
			: map.getCenter();

		centerMarkerRef.current = L.marker(initialCenter, {
			icon: L.divIcon({
				// html: renderToString(<ICircle size={24} color="#007BFF" />),
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

	// Lắng nghe sự kiện di chuyển map
	useMapEvents({
		move: () => {
			const newCenter = map.getCenter();
			centerMarkerRef.current?.setLatLng(newCenter);
			setCircleCenter(newCenter);
		},
	});

	// Tạo nhiều sóng radar
	const waves = [0, 0.33, 0.66]; // 3 sóng tuần tự

	return (
		<>
			{/* Vòng tròn gốc */}
			<Circle
				center={circleCenter}
				radius={radius}
				pathOptions={{
					color: 'transparent',
					fillColor: '#007BFF',
					fillOpacity: 0.15,
				}}
			/>

			{/* Radar waves (nằm trong vòng gốc) */}
			{loading &&
				waves.map((offset, i) => {
					const progress = (pulse + offset) % 1; // 0 → 1
					const waveRadius = progress * radius; // lan từ 0 → radius
					const opacity = 0.4 * (1 - progress); // mờ dần khi gần biên

					return (
						<Circle
							key={i}
							center={circleCenter}
							radius={waveRadius}
							pathOptions={{
								color: 'transparent',
								fillColor: '#007BFF',
								fillOpacity: opacity,
							}}
						/>
					);
				})}
		</>
	);
};

export default CenterMapControl;
