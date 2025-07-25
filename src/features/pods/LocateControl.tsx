'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useLocationTrackingContext } from '@/hooks/LocationTrackingContext';

export default function LocateControl() {
	const map = useMap();
	const { currentLocation } = useLocationTrackingContext();

	useEffect(() => {
		if (!map) return;

		const locateControl = new L.Control({ position: 'bottomright' }); // 👈 Vị trí

		locateControl.onAdd = () => {
			const container = L.DomUtil.create('button', 'leaflet-bar leaflet-control');
			container.title = 'Current location';
			container.innerHTML = `<i class="fa-solid fa-crosshairs"></i>`;

			Object.assign(container.style, {
				width: '36px',
				height: '36px',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				cursor: 'pointer',
				background: 'white',
				border: '1px solid #ccc',
				borderRadius: '4px',
				boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
			});

			L.DomEvent.disableClickPropagation(container);

			container.addEventListener('click', () => {
				if (!currentLocation) return;

				const latlng = L.latLng(currentLocation.latitude, currentLocation.longitude);
				map.flyTo(latlng, 15, { duration: 2 });
			});

			return container;
		};

		locateControl.addTo(map);

		return () => {
			locateControl.remove();
		};
	}, [map, currentLocation]);

	return null;
}
