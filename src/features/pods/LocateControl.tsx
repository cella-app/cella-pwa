'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useLocationTrackingContext } from '@/hooks/LocationTrackingContext';

interface LocateControlProps {
	fetchPodsBasedOnMap: (location: { latitude: number; longitude: number }, currentZoom: number) => void;
}

export default function LocateControl({ fetchPodsBasedOnMap }: LocateControlProps) {
	const map = useMap();
	const { currentLocation } = useLocationTrackingContext();

	useEffect(() => {
		if (!map) return;

		const createButtonControl = (title: string, innerHTML: string, onClick: () => void) => {
			const control = new L.Control({ position: 'bottomright' });

			control.onAdd = () => {
				const button = L.DomUtil.create('button', 'leaflet-bar leaflet-control');
				button.title = title;
				button.innerHTML = innerHTML;

				Object.assign(button.style, {
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

				L.DomEvent.disableClickPropagation(button);
				button.addEventListener('click', onClick);
				return button;
			};

			return control;
		};

		const locateControl = createButtonControl(
			'Current location',
			`<i class="fa-solid fa-crosshairs"></i>`,
			() => {
				if (!currentLocation) return;
				const latlng = L.latLng(currentLocation.latitude, currentLocation.longitude);
				map.flyTo(latlng, 15, { duration: 2 });
			}
		);

		const reloadControl = createButtonControl(
			'Reload Pod Data',
			`<i class="fa-solid fa-rotate-right"></i>`,
			() => {
				window.location.reload();
			}
		);


		locateControl.addTo(map);
		reloadControl.addTo(map);

		const locateButtonElement = locateControl.getContainer();
		const reloadButtonElement = reloadControl.getContainer();

		if (locateButtonElement && reloadButtonElement) {
			reloadButtonElement.style.marginTop = '8px';
		}

		return () => {
			locateControl.remove();
			reloadControl.remove();
		};
	}, [map, currentLocation, fetchPodsBasedOnMap]);

	return null;
}
