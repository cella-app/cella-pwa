'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useLocationTrackingContext } from '@/hooks/LocationTrackingContext';
import {
	getEnvironmentInfo,
	getBottomOffset,
	SPACING,
	BUTTON_SIZES
} from '@/shared/utils/positioning';

interface LocateControlProps {
	onLocate: (latlng: { latitude: number; longitude: number }) => void;
}

export default function LocateControl({ onLocate }: LocateControlProps) {
	const map = useMap();
	const { currentLocation } = useLocationTrackingContext();

	useEffect(() => {
		if (!map) return;

		console.log("🚀 LocateControl - Initializing...");

		const createButtonControl = (title: string, innerHTML: string, onClick: () => void) => {
			const control = new L.Control({ position: 'bottomright' });

			control.onAdd = () => {
				const button = L.DomUtil.create('button', 'leaflet-bar leaflet-control');
				button.title = title;
				button.innerHTML = innerHTML;

				Object.assign(button.style, {
					width: `${BUTTON_SIZES.LOCATE_CONTROL}px`,
					height: `${BUTTON_SIZES.LOCATE_CONTROL}px`,
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
				console.log("📍 LocateControl - Location button clicked");
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

		// Function to update control position using shared utilities
		const updateControlPosition = () => {
			const env = getEnvironmentInfo();
			const bottomOffset = getBottomOffset(env.isSafari, env.isIOS, env.isStandalone);

			const controlCorner = document.querySelector('.leaflet-bottom.leaflet-right') as HTMLElement;
			if (controlCorner) {
				console.log("📍 LocateControl - Updating position:", {
					previousBottom: controlCorner.style.bottom,
					newBottom: bottomOffset,
					rightMargin: `${SPACING.EDGE_MARGIN}px`
				});

				controlCorner.style.bottom = bottomOffset;
				controlCorner.style.right = `${SPACING.EDGE_MARGIN}px`; // ✅ Consistent với AddToHomeScreen
				controlCorner.style.transition = 'bottom 0.3s ease'; // Smooth transition
			}
		};

		// Initial position setup
		updateControlPosition();

		// Listen for display mode changes (PWA transitions)
		const mediaQuery = window.matchMedia('(display-mode: standalone)');
		const handleDisplayModeChange = (e: MediaQueryListEvent) => {
			console.log("🔄 LocateControl - Display mode changed:", e.matches ? 'standalone' : 'browser');
			setTimeout(updateControlPosition, 100); // Small delay for transition
		};
		mediaQuery.addEventListener('change', handleDisplayModeChange);

		// Listen for window resize (for Safari UI changes)
		const handleResize = () => {
			console.log("📏 LocateControl - Window resized");
			setTimeout(updateControlPosition, 100);
		};
		window.addEventListener('resize', handleResize);

		// Listen for visual viewport changes (iOS Safari)
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const visualViewport = (window as any).visualViewport;
		if (visualViewport) {
			console.log("👁️ LocateControl - Adding visualViewport listener");
			visualViewport.addEventListener('resize', handleResize);
		}

		// Update button state based on currentLocation
		const locateButtonElement = locateControl.getContainer();
		if (locateButtonElement) {
			const button = locateButtonElement.querySelector('button') as HTMLButtonElement;
			if (button) {
				button.style.cursor = currentLocation ? 'pointer' : 'not-allowed';
				button.style.opacity = currentLocation ? '1' : '0.5';
				button.disabled = !currentLocation;
				console.log("🔘 LocateControl - Button state updated:", {
					hasLocation: !!currentLocation,
					disabled: !currentLocation
				});
			}
		}

		return () => {
			console.log("🧹 LocateControl - Cleaning up...");
			mediaQuery.removeEventListener('change', handleDisplayModeChange);
			window.removeEventListener('resize', handleResize);
			if (visualViewport) {
				visualViewport.removeEventListener('resize', handleResize);
			}
			locateControl.remove();
		};
	}, [map, currentLocation, onLocate]);

	return null;
}