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

		const locateControl = new L.Control({ position: 'topleft' });

		locateControl.onAdd = () => {
			const container = L.DomUtil.create('button', 'leaflet-bar leaflet-control');
			container.title = 'Current localte';
			container.style.width = '36px';
			container.style.height = '36px';
			container.style.display = 'flex';
			container.style.alignItems = 'center';
			container.style.justifyContent = 'center';
			container.style.cursor = 'pointer';
			container.innerHTML = `<i class="fa-solid fa-crosshairs"></i>`;

			L.DomEvent.disableClickPropagation(container);

			container.addEventListener('click', () => {
				if (!currentLocation) {
					return;
				}

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
