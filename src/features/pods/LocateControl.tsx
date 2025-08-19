'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useLocationTrackingContext } from '@/hooks/LocationTrackingContext';

interface LocateControlProps {
	fetchPodsBasedOnMap: (location: { latitude: number; longitude: number }, currentZoom: number) => void;
	onLocate: (latlng: { latitude: number; longitude: number }) => void;
}

export default function LocateControl({ fetchPodsBasedOnMap, onLocate }: LocateControlProps) {
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

				map.flyTo(latlng, 15, { duration: 0.5 });

				onLocate({
					latitude: latlng.lat,
					longitude: latlng.lng,
				});
			}
		);

		const reloadControl = createButtonControl(
			'Reload Pod Data',
			`<i class="fa-solid fa-rotate-right"></i>`,
			() => {
				const currentCenter = map.getCenter();
				const currentZoom = map.getZoom();
				fetchPodsBasedOnMap(
					{ latitude: currentCenter.lat, longitude: currentCenter.lng },
					currentZoom
				);
			}
		);

		locateControl.addTo(map);
		reloadControl.addTo(map);

		const locateButtonElement = locateControl.getContainer();
		const reloadButtonElement = reloadControl.getContainer();

		if (locateButtonElement) {
			locateButtonElement.style.cursor = currentLocation ? 'pointer' : 'not-allowed';
			locateButtonElement.style.opacity = currentLocation ? '1' : '0.5';
			(locateButtonElement as HTMLButtonElement).disabled = !currentLocation;
		}

		if (locateButtonElement && reloadButtonElement) {
			reloadButtonElement.style.marginTop = '8px';
		}

		return () => {
			locateControl.remove();
			reloadControl.remove();
		};
	}, [map, currentLocation, fetchPodsBasedOnMap, onLocate]);

	return null;
}
