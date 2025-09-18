'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useLocationTrackingContext } from '@/hooks/LocationTrackingContext';

interface LocateControlProps {
	onLocate: (latlng: { latitude: number; longitude: number }) => void;
}

// Helper functions for environment detection
function isInStandaloneMode(): boolean {
	if (typeof window === "undefined") return false;
	const standalone = (
		window.matchMedia("(display-mode: standalone)").matches ||
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(window.navigator as any).standalone === true
	);
	console.log("🔍 LocateControl - isInStandaloneMode:", {
		standalone,
		displayMode: window.matchMedia("(display-mode: standalone)").matches,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		navigatorStandalone: (window.navigator as any).standalone
	});
	return standalone;
}

function getEnvironmentInfo() {
	if (typeof window === "undefined") {
		return { isSafari: false, isIOS: false, isStandalone: false };
	}

	const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
	const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
	const isStandalone = isInStandaloneMode();

	console.log("🔍 LocateControl - Environment:", {
		isSafari,
		isIOS,
		isStandalone,
		userAgent: navigator.userAgent,
		windowHeight: window.innerHeight
	});

	return { isSafari, isIOS, isStandalone };
}

function getBottomOffset(isSafari: boolean, isIOS: boolean, isStandalone: boolean): string {
	console.log("🔍 LocateControl - getBottomOffset input:", { isSafari, isIOS, isStandalone });

	// PWA mode - use standard offset
	if (isStandalone) {
		console.log("✅ LocateControl Case: PWA/Standalone - returning 0.75rem");
		return '0.75rem';
	}

	// iOS Safari - need extra space for bottom UI
	if (isIOS && isSafari) {
		console.log("✅ LocateControl Case: iOS Safari - returning 6rem");
		return '6rem';
	}

	// iOS other browsers (Chrome, etc) - moderate space
	if (isIOS) {
		console.log("✅ LocateControl Case: iOS other browser - returning 4rem");
		return '4rem';
	}

	// Desktop Safari - small space
	if (isSafari) {
		console.log("✅ LocateControl Case: Desktop Safari - returning 2rem");
		return '2rem';
	}

	// Other browsers - standard
	console.log("✅ LocateControl Case: Other browser - returning 0.75rem");
	return '0.75rem';
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

		// Function to update control position
		const updateControlPosition = () => {
			const env = getEnvironmentInfo();
			const bottomOffset = getBottomOffset(env.isSafari, env.isIOS, env.isStandalone);

			const controlCorner = document.querySelector('.leaflet-bottom.leaflet-right') as HTMLElement;
			if (controlCorner) {
				console.log("📍 LocateControl - Updating position:", {
					previousBottom: controlCorner.style.bottom,
					newBottom: bottomOffset
				});

				controlCorner.style.bottom = bottomOffset;
				controlCorner.style.right = '1rem';
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