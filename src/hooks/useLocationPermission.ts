// hooks/useLocationPermission.ts
import { useState, useEffect, useCallback } from 'react';

const LOCATION_PERMISSION_KEY = "locationPermissionAsked";
const LOCATION_TRACKING_KEY = "startTracking";

export interface LocationPermissionState {
	hasAskedPermission: boolean;
	isTrackingAllowed: boolean;
	needsUserDecision: boolean;
	permissionState: 'granted' | 'denied' | 'prompt' | 'unknown';
}

export const useLocationPermission = () => {
	const [state, setState] = useState<LocationPermissionState>({
		hasAskedPermission: false,
		isTrackingAllowed: false,
		needsUserDecision: false,
		permissionState: 'unknown'
	});

	const [isLoading, setIsLoading] = useState(true);

	// Check initial permission state
	useEffect(() => {
		const checkPermissionState = async () => {
			if (typeof window === 'undefined') {
				setIsLoading(false);
				return;
			}

			const hasAskedBefore = localStorage.getItem(LOCATION_PERMISSION_KEY) === 'true';
			const trackingPreference = localStorage.getItem(LOCATION_TRACKING_KEY) === 'true';

			console.log('🔍 Permission Check - hasAskedBefore:', hasAskedBefore, 'trackingPreference:', trackingPreference);

			// If we already handled permission, use stored preference
			if (hasAskedBefore) {
				setState({
					hasAskedPermission: true,
					isTrackingAllowed: trackingPreference,
					needsUserDecision: false,
					permissionState: trackingPreference ? 'granted' : 'denied'
				});
				setIsLoading(false);
				return;
			}

			// Check browser permission API
			if (navigator.permissions) {
				try {
					const result = await navigator.permissions.query({ name: 'geolocation' });
					console.log('🔍 Browser permission state:', result.state);

					switch (result.state) {
						case 'granted':
							// Auto-allow if browser already granted
							setState({
								hasAskedPermission: true,
								isTrackingAllowed: true,
								needsUserDecision: false,
								permissionState: 'granted'
							});
							// Persist the decision
							localStorage.setItem(LOCATION_PERMISSION_KEY, 'true');
							localStorage.setItem(LOCATION_TRACKING_KEY, 'true');
							break;

						case 'denied':
							// Auto-deny if browser already denied
							setState({
								hasAskedPermission: true,
								isTrackingAllowed: false,
								needsUserDecision: false,
								permissionState: 'denied'
							});
							localStorage.setItem(LOCATION_PERMISSION_KEY, 'true');
							localStorage.setItem(LOCATION_TRACKING_KEY, 'false');
							break;

						case 'prompt':
							// Need user decision
							setState({
								hasAskedPermission: false,
								isTrackingAllowed: false,
								needsUserDecision: true,
								permissionState: 'prompt'
							});
							break;
					}

					// Listen for permission changes
					result.onchange = () => {
						console.log('🔄 Permission changed to:', result.state);
						checkPermissionState();
					};

				} catch (error) {
					console.warn('⚠️ Permissions API failed:', error);
					// Fallback: need user decision
					setState({
						hasAskedPermission: false,
						isTrackingAllowed: false,
						needsUserDecision: true,
						permissionState: 'unknown'
					});
				}
			} else {
				console.warn('⚠️ Permissions API not supported');
				// Fallback: need user decision
				setState({
					hasAskedPermission: false,
					isTrackingAllowed: false,
					needsUserDecision: true,
					permissionState: 'unknown'
				});
			}

			setIsLoading(false);
		};

		checkPermissionState();
	}, []);

	// Handle user allowing location
	const allowLocation = useCallback(() => {
		console.log('✅ User allowed location tracking');

		setState(prev => ({
			...prev,
			hasAskedPermission: true,
			isTrackingAllowed: true,
			needsUserDecision: false,
			permissionState: 'granted'
		}));

		// Persist decision
		localStorage.setItem(LOCATION_PERMISSION_KEY, 'true');
		localStorage.setItem(LOCATION_TRACKING_KEY, 'true');
	}, []);

	// Handle user denying location
	const denyLocation = useCallback(() => {
		console.log('❌ User denied location tracking');

		setState(prev => ({
			...prev,
			hasAskedPermission: true,
			isTrackingAllowed: false,
			needsUserDecision: false,
			permissionState: 'denied'
		}));

		// Persist decision
		localStorage.setItem(LOCATION_PERMISSION_KEY, 'true');
		localStorage.setItem(LOCATION_TRACKING_KEY, 'false');
	}, []);

	// Toggle tracking (for settings)
	const toggleTracking = useCallback((enabled: boolean) => {
		console.log('🔄 Toggling location tracking:', enabled);

		setState(prev => ({
			...prev,
			isTrackingAllowed: enabled,
			permissionState: enabled ? 'granted' : 'denied'
		}));

		localStorage.setItem(LOCATION_TRACKING_KEY, enabled.toString());
	}, []);

	// Reset permission (for testing/settings)
	const resetPermission = useCallback(() => {
		console.log('🔄 Resetting location permission');

		setState({
			hasAskedPermission: false,
			isTrackingAllowed: false,
			needsUserDecision: true,
			permissionState: 'unknown'
		});

		localStorage.removeItem(LOCATION_PERMISSION_KEY);
		localStorage.removeItem(LOCATION_TRACKING_KEY);
	}, []);

	return {
		...state,
		isLoading,
		allowLocation,
		denyLocation,
		toggleTracking,
		resetPermission
	};
};