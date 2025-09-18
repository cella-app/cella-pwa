// hooks/useLocationPermission.ts
import { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash'; // Giả sử bạn dùng lodash để debounce

// Định nghĩa các khóa mặc định
const DEFAULT_CONFIG = {
	LOCATION_PERMISSION_KEY: 'locationPermissionAsked',
	LOCATION_TRACKING_KEY: 'startTracking',
	PERMISSION_TIMEOUT: 5000, // Timeout 5 giây cho permissions query
};

export interface LocationPermissionState {
	hasAskedPermission: boolean;
	isTrackingAllowed: boolean;
	needsUserDecision: boolean;
	permissionState: 'granted' | 'denied' | 'prompt' | 'unknown';
	errorMessage: string | null;
	isDeviceLocationAvailable: boolean;
}

export interface LocationPermissionConfig {
	locationPermissionKey?: string;
	locationTrackingKey?: string;
	permissionTimeout?: number;
}

export const useLocationPermission = (config: LocationPermissionConfig = {}) => {
	const {
		locationPermissionKey = DEFAULT_CONFIG.LOCATION_PERMISSION_KEY,
		locationTrackingKey = DEFAULT_CONFIG.LOCATION_TRACKING_KEY,
		permissionTimeout = DEFAULT_CONFIG.PERMISSION_TIMEOUT,
	} = config;

	const [state, setState] = useState<LocationPermissionState>({
		hasAskedPermission: false,
		isTrackingAllowed: false,
		needsUserDecision: false,
		permissionState: 'unknown',
		errorMessage: null,
		isDeviceLocationAvailable: false,
	});

	const [isLoading, setIsLoading] = useState(true);

	// Hàm kiểm tra khả năng lấy vị trí thực tế
	const checkGeolocationAvailability = useCallback(
		async (callback: (isAvailable: boolean, error?: string) => void) => {
			if (!navigator.geolocation) {
				callback(false, 'Geolocation không được hỗ trợ trên thiết bị này.');
				return;
			}

			try {
				await navigator.geolocation.getCurrentPosition(
					() => callback(true),
					(error) => callback(false, `Lỗi lấy vị trí: ${error.message}`),
					{ timeout: 5000, maximumAge: 0, enableHighAccuracy: false }
				);
			} catch (error) {
				callback(false, `Lỗi lấy vị trí: ${(error as Error).message}`);
			}
		},
		[]
	);

	// Kiểm tra trạng thái quyền
	useEffect(() => {
		const checkPermissionState = async () => {
			if (typeof window === 'undefined') {
				setState((prev) => ({ ...prev, errorMessage: 'Môi trường không hỗ trợ geolocation' }));
				setIsLoading(false);
				return;
			}

			// Kiểm tra sessionStorage
			const hasAskedBefore = sessionStorage.getItem(locationPermissionKey) === 'true';
			const trackingPreference = sessionStorage.getItem(locationTrackingKey) === 'true';
			const permanentlyDenied = sessionStorage.getItem(`${locationPermissionKey}_permanent`) === 'true';

			console.log(
				'🔍 Permission Check - hasAskedBefore:',
				hasAskedBefore,
				'trackingPreference:',
				trackingPreference,
				'permanentlyDenied:',
				permanentlyDenied
			);

			// Nếu đã từ chối vĩnh viễn, không hỏi lại
			if (permanentlyDenied) {
				setState({
					hasAskedPermission: true,
					isTrackingAllowed: false,
					needsUserDecision: false,
					permissionState: 'denied',
					errorMessage: 'Quyền truy cập vị trí đã bị từ chối vĩnh viễn',
					isDeviceLocationAvailable: false,
				});
				setIsLoading(false);
				return;
			}

			// Nếu đã hỏi trước đó, sử dụng preference
			if (hasAskedBefore) {
				setState({
					hasAskedPermission: true,
					isTrackingAllowed: trackingPreference,
					needsUserDecision: false,
					permissionState: trackingPreference ? 'granted' : 'denied',
					errorMessage: null,
					isDeviceLocationAvailable: trackingPreference,
				});
				setIsLoading(false);
				return;
			}

			// Kiểm tra khả năng lấy vị trí
			await checkGeolocationAvailability(async (isAvailable, error) => {
				if (!isAvailable) {
					setState((prev) => ({
						...prev,
						errorMessage: error || 'Không thể truy cập vị trí',
						isDeviceLocationAvailable: false,
					}));
					setIsLoading(false);
					return;
				}

				// Kiểm tra quyền trình duyệt
				if (navigator.permissions) {
					try {
						const timeoutPromise = new Promise<never>((_, reject) =>
							setTimeout(() => reject(new Error('Timeout khi kiểm tra quyền')), permissionTimeout)
						);
						const permissionPromise = navigator.permissions.query({ name: 'geolocation' });

						// TypeScript: Đảm bảo result là PermissionStatus
						const result = (await Promise.race([permissionPromise, timeoutPromise])) as PermissionStatus;

						console.log('🔍 Browser permission state:', result.state);

						switch (result.state) {
							case 'granted':
								setState({
									hasAskedPermission: true,
									isTrackingAllowed: true,
									needsUserDecision: false,
									permissionState: 'granted',
									errorMessage: null,
									isDeviceLocationAvailable: true,
								});
								sessionStorage.setItem(locationPermissionKey, 'true');
								sessionStorage.setItem(locationTrackingKey, 'true');
								break;

							case 'denied':
								setState({
									hasAskedPermission: true,
									isTrackingAllowed: false,
									needsUserDecision: false,
									permissionState: 'denied',
									errorMessage: 'Quyền truy cập vị trí bị từ chối',
									isDeviceLocationAvailable: false,
								});
								sessionStorage.setItem(locationPermissionKey, 'true');
								sessionStorage.setItem(locationTrackingKey, 'false');
								break;

							case 'prompt':
								// Thử gọi getCurrentPosition để kích hoạt lời nhắc quyền
								await checkGeolocationAvailability((isAvailable, error) => {
									if (isAvailable) {
										setState({
											hasAskedPermission: false,
											isTrackingAllowed: false,
											needsUserDecision: true,
											permissionState: 'prompt',
											errorMessage: null,
											isDeviceLocationAvailable: true,
										});
									} else {
										setState({
											hasAskedPermission: true,
											isTrackingAllowed: false,
											needsUserDecision: false,
											permissionState: 'denied',
											errorMessage: error || 'Không thể truy cập vị trí',
											isDeviceLocationAvailable: false,
										});
									}
								});
								break;

							default:
								setState({
									hasAskedPermission: false,
									isTrackingAllowed: false,
									needsUserDecision: true,
									permissionState: 'unknown',
									errorMessage: 'Trạng thái quyền không xác định',
									isDeviceLocationAvailable: false,
								});
						}

						// Lắng nghe thay đổi quyền với debounce
						result.onchange = debounce(() => {
							console.log('🔄 Permission changed to:', result.state);
							checkPermissionState();
						}, 500);

					} catch (error) {
						console.warn('⚠️ Permissions API failed:', error);
						setState({
							hasAskedPermission: false,
							isTrackingAllowed: false,
							needsUserDecision: true,
							permissionState: 'unknown',
							errorMessage: `Lỗi kiểm tra quyền: ${(error as Error).message}`,
							isDeviceLocationAvailable: false,
						});
					}
				} else {
					console.warn('⚠️ Permissions API not supported');
					setState({
						hasAskedPermission: false,
						isTrackingAllowed: false,
						needsUserDecision: true,
						permissionState: 'unknown',
						errorMessage: 'Trình duyệt không hỗ trợ API Permissions',
						isDeviceLocationAvailable: false,
					});
				}

				setIsLoading(false);
			});
		};

		checkPermissionState();
	}, [checkGeolocationAvailability, locationPermissionKey, locationTrackingKey, permissionTimeout]);

	// Cho phép truy cập vị trí
	const allowLocation = useCallback(() => {
		console.log('✅ User allowed location tracking');
		setState((prev) => ({
			...prev,
			hasAskedPermission: true,
			isTrackingAllowed: true,
			needsUserDecision: false,
			permissionState: 'granted',
			errorMessage: null,
			isDeviceLocationAvailable: true,
		}));
		sessionStorage.setItem(locationPermissionKey, 'true');
		sessionStorage.setItem(locationTrackingKey, 'true');
	}, [locationPermissionKey, locationTrackingKey]);

	// Từ chối truy cập vị trí
	const denyLocation = useCallback(
		(permanent: boolean = false) => {
			console.log('❌ User denied location tracking, permanent:', permanent);
			setState((prev) => ({
				...prev,
				hasAskedPermission: true,
				isTrackingAllowed: false,
				needsUserDecision: false,
				permissionState: 'denied',
				errorMessage: permanent ? 'Quyền truy cập vị trí đã bị từ chối vĩnh viễn' : null,
				isDeviceLocationAvailable: false,
			}));
			sessionStorage.setItem(locationPermissionKey, 'true');
			sessionStorage.setItem(locationTrackingKey, 'false');
			if (permanent) {
				sessionStorage.setItem(`${locationPermissionKey}_permanent`, 'true');
			}
		},
		[locationPermissionKey, locationTrackingKey]
	);

	// Bật/tắt theo dõi
	const toggleTracking = useCallback(
		(enabled: boolean) => {
			console.log('🔄 Toggling location tracking:', enabled);
			setState((prev) => ({
				...prev,
				isTrackingAllowed: enabled,
				permissionState: enabled ? 'granted' : 'denied',
				errorMessage: null,
			}));
			sessionStorage.setItem(locationTrackingKey, enabled.toString());
		},
		[locationTrackingKey]
	);

	// Đặt lại quyền
	const resetPermission = useCallback(() => {
		console.log('🔄 Resetting location permission');
		setState({
			hasAskedPermission: false,
			isTrackingAllowed: false,
			needsUserDecision: true,
			permissionState: 'unknown',
			errorMessage: 'Vui lòng đặt lại quyền vị trí trong cài đặt trình duyệt nếu cần.',
			isDeviceLocationAvailable: false,
		});
		sessionStorage.removeItem(locationPermissionKey);
		sessionStorage.removeItem(locationTrackingKey);
		sessionStorage.removeItem(`${locationPermissionKey}_permanent`);
	}, [locationPermissionKey, locationTrackingKey]);

	return {
		...state,
		isLoading,
		allowLocation,
		denyLocation,
		toggleTracking,
		resetPermission,
	};
};