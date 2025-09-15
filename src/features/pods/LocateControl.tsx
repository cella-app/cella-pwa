'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useLocationTrackingContext } from '@/hooks/LocationTrackingContext';

interface LocateControlProps {
	onLocate: (latlng: { latitude: number; longitude: number }) => void;
}

export default function LocateControl({ onLocate }: LocateControlProps) {
	const map = useMap();
	const { currentLocation } = useLocationTrackingContext();

	useEffect(() => {
		if (!map) return;

		// Detect Safari browser
		const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
		const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
		
		const createButtonControl = (title: string, innerHTML: string, onClick: () => void) => {
			const control = new L.Control({ position: 'bottomright' });

			control.onAdd = () => {
				const button = L.DomUtil.create('button', 'leaflet-bar leaflet-control');
				button.title = title;
				button.innerHTML = innerHTML;

				Object.assign(button.style, {
					width: '44px',
					height: '44px',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					cursor: 'pointer',
					background: 'white',
					border: '1px solid #ccc',
					borderRadius: '4px',
					boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
					zIndex: '1000',
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


		locateControl.addTo(map);

		// Apply bottom margin to the entire control container with Safari-specific adjustments
		const controlCorner = document.querySelector('.leaflet-bottom.leaflet-right') as HTMLElement;
		if (controlCorner) {
			if (isSafari || isIOS) {
				// Add extra bottom margin for Safari/iOS to avoid Safari UI elements
				controlCorner.style.bottom = isIOS ? '6rem' : '2rem';
				controlCorner.style.right = '1rem';
			} else {
				controlCorner.style.bottom = '0.75rem';
			}
		}

		const locateButtonElement = locateControl.getContainer();

		if (locateButtonElement) {
			const button = locateButtonElement.querySelector('button') as HTMLButtonElement;
			if (button) {
				button.style.cursor = currentLocation ? 'pointer' : 'not-allowed';
				button.style.opacity = currentLocation ? '1' : '0.5';
				button.disabled = !currentLocation;
			}
		}

		return () => {
			locateControl.remove();
		};
	}, [map, currentLocation, onLocate]);

	return null;
}
