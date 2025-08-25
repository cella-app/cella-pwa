import { useState, useEffect, useCallback, useRef } from 'react';
import L from 'leaflet';
import { useLocationStore } from '@/features/map/stores/location.store';
import { LocationData } from '@/shared/data/models/Location';
import { calculateDistanceNew, getAllowedToGetPodsThreshold, getAllowedCenterThreshold } from '@/shared/utils/location';
import { useMapConditionStore } from '@/features/map/stores/mapCondition.store';
import { usePodStore } from '@/features/pods/stores/pod.store';
import { getPodsNearMe } from '@/features/pods/pods.action';
import debounce from 'lodash/debounce';

const RETRY_DELAY = 500; // Thời gian chờ trước khi thử lại khi có lỗi geolocation
const DEBOUNCE_TIME = 300; // Thời gian debounce (ms) cho centerMap
const FETCH_DEBOUNCE_TIME = 500; // Thời gian debounce cho fetchPods

export function useLocationTracking(
  radius: number = 600,
  currentMapCenter?: LocationData | null,
  startTracking: boolean = false,
  map?: L.Map,
) {
  const [isUserOutOfView, setIsUserOutOfView] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isMapInteracting, setIsMapInteracting] = useState(false);
  const [lastInteractionTime, setLastInteractionTime] = useState(0);

  const watchIdRef = useRef<number | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFetchedCenter = useRef<LocationData | null>(null); // Center của lần fetch trước
  const lastSavedUserLocation = useRef<LocationData | null>(null); // User location đã được save để kiểm tra movement

  // Check if user is currently controlling the map
  const isUserInControl = useCallback(() => {
    const COOLDOWN_TIME = 2000; // 2s after interaction stops
    return isMapInteracting || (Date.now() - lastInteractionTime < COOLDOWN_TIME);
  }, [isMapInteracting, lastInteractionTime]);

  const { setLocation, currentLocation, lastLocation, setLastLocation } = useLocationStore();
  const { setStateLocationDiffValid } = useMapConditionStore();
  const { pods, setPods } = usePodStore();

  // Kiểm tra xem user có di chuyển đủ xa để cần update không
  const shouldUpdateUserLocation = useCallback(
    (newLocation: LocationData): boolean => {
      if (!lastSavedUserLocation.current) return true;

      const threshold = getAllowedToGetPodsThreshold(radius);
      const distance = calculateDistanceNew(newLocation, lastSavedUserLocation.current);
      return distance >= threshold;
    },
    [radius]
  );

  // Kiểm tra xem user và center có trong phạm vi hợp lệ không
  const isUserCenterInValidRange = useCallback(
    (userLocation: LocationData, centerLocation: LocationData): boolean => {
      const threshold = getAllowedCenterThreshold(radius);
      const distance = calculateDistanceNew(userLocation, centerLocation);
      return distance <= threshold;
    },
    [radius]
  );

  // Define the actual (non-debounced) fetch function
  const fetchPodsInternal = useCallback(
    async (center: LocationData, rad: number) => {
      try {
        setLoading(true);
        setError(null);
        const response = await getPodsNearMe({
          latitude: center.latitude,
          longitude: center.longitude,
          radius: rad,
        });
        if (response?.data?.pods) {
          setPods(response.data.pods);
          lastFetchedCenter.current = center; // Cập nhật sau fetch thành công
        } else {
          throw new Error('Invalid response format from server');
        }
      } catch (err) {
        console.error('Error fetching pods:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch pods';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, setPods]
  );

  // Store the debounced fetchPods function in a ref
  const debouncedFetchPodsRef = useRef(debounce(fetchPodsInternal, FETCH_DEBOUNCE_TIME));

  // Update the debounced function if fetchPodsInternal changes
  useEffect(() => {
    debouncedFetchPodsRef.current = debounce(fetchPodsInternal, FETCH_DEBOUNCE_TIME);
    return () => {
      debouncedFetchPodsRef.current.cancel();
    };
  }, [fetchPodsInternal]);

  // Kiểm tra xem có nên fetch pods không dựa trên center position
  const shouldFetchPods = useCallback(
    (center: LocationData): boolean => {
      if (!center) return false;
      if (!lastFetchedCenter.current) return true;

      const threshold = getAllowedCenterThreshold(radius);
      const distance = calculateDistanceNew(center, lastFetchedCenter.current);
      console.log("fetch threshold-distance", threshold, distance);
      return distance >= threshold;
    },
    [radius]
  );

  // Check if user's location is within the map bounds
  const checkUserOutOfView = useCallback(() => {
    if (!map || !currentLocation) {
      setIsUserOutOfView(false);
      return;
    }
    try {
      const bounds = map.getBounds();
      const { latitude, longitude } = currentLocation;
      const isOut = !bounds.contains([latitude, longitude]);
      setIsUserOutOfView(isOut);
    } catch (err) {
      console.error('Error checking user out of view:', err);
      setIsUserOutOfView(false);
    }
  }, [map, currentLocation]);

  // Handle successful geolocation
  const handleLocationSuccess = useCallback(
    (position: GeolocationPosition) => {
      console.log("Geolocation success", position);
      const newLocation: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      // Luôn update current location
      setLocation(newLocation);
      setError(null);

      // Kiểm tra xem có nên update lastLocation và trigger state change không
      if (shouldUpdateUserLocation(newLocation)) {
        console.log("User moved enough, updating saved location");
        setLastLocation(newLocation);
        setStateLocationDiffValid(true);
        lastSavedUserLocation.current = newLocation;
      } else {
        // Nếu chưa di chuyển đủ xa, vẫn set valid state dựa trên lastLocation hiện tại
        if (lastLocation) {
          const threshold = getAllowedToGetPodsThreshold(radius);
          const diff = calculateDistanceNew(newLocation, lastLocation);
          setStateLocationDiffValid(diff >= threshold);
        } else {
          // Lần đầu tiên, set lastLocation
          setLastLocation(newLocation);
          setStateLocationDiffValid(true);
          lastSavedUserLocation.current = newLocation;
        }
      }
    },
    [setLocation, setLastLocation, setStateLocationDiffValid, shouldUpdateUserLocation, lastLocation, radius]
  );

  // Handle geolocation errors and retry
  const handleGeolocationError = useCallback(
    (error: GeolocationPositionError) => {
      console.error('Geolocation error:', error);
      let errorMessage = 'Error tracking location';

      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Location access denied by user';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Location information unavailable';
          break;
        case error.TIMEOUT:
          errorMessage = 'Location request timed out';
          if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
          retryTimeoutRef.current = setTimeout(() => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                handleLocationSuccess,
                (retryError) => {
                  console.error('Retry geolocation error:', retryError);
                  setError('Failed to get location after retry');
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
              );
            }
          }, RETRY_DELAY);
          break;
      }

      setError(errorMessage);
    },
    [handleLocationSuccess]
  );

  // Start location tracking
  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    if (!startTracking) return;

    const cleanup = () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };

    cleanup();

    const watchId = navigator.geolocation.watchPosition(
      handleLocationSuccess,
      handleGeolocationError,
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      }
    );

    watchIdRef.current = watchId;

    return cleanup;
  }, [handleLocationSuccess, handleGeolocationError, startTracking]);

  // Define the actual (non-debounced) center map function
  const centerMapInternal = useCallback(
    (location: LocationData) => {
      if (map && !isUserInControl() && currentMapCenter) {
        // Chỉ auto-follow khi user không đang tương tác
        if (isUserCenterInValidRange(location, currentMapCenter)) {
          console.log('🎯 Auto-following user (not in control)');
          try {
            map.flyTo([location.latitude, location.longitude], map.getZoom(), {
              duration: 0.5,
              easeLinearity: 0.25,
            });
          } catch (err) {
            console.error('Error centering map:', err);
          }
        }
      } else if (isUserInControl()) {
        console.log('⏸️ Skipping auto-follow - user in control');
      }
    },
    [map, isUserInControl, currentMapCenter, isUserCenterInValidRange]
  );

  // Store the debounced centerMap function in a ref
  const debouncedCenterMapRef = useRef(debounce(centerMapInternal, DEBOUNCE_TIME));

  // Update the debounced function if centerMapInternal changes
  useEffect(() => {
    debouncedCenterMapRef.current = debounce(centerMapInternal, DEBOUNCE_TIME);
    return () => {
      debouncedCenterMapRef.current.cancel();
    };
  }, [centerMapInternal]);

  // Auto-center và check out of view khi location thay đổi
  useEffect(() => {
    if (currentLocation) {
      // Chỉ center khi user di chuyển đủ xa (đã update saved location)
      if (lastSavedUserLocation.current &&
        calculateDistanceNew(currentLocation, lastSavedUserLocation.current) < getAllowedToGetPodsThreshold(radius)) {
        // User chưa di chuyển đủ xa, không center
      } else {
        debouncedCenterMapRef.current(currentLocation);
      }
      checkUserOutOfView();
    }
  }, [currentLocation, checkUserOutOfView, radius]);

  // Xử lý sự kiện drag/zoom để set isMapInteracting
  useEffect(() => {
    if (!map) return;

    const handleDragStart = () => {
      console.log('🖱️ User starts dragging');
      setIsMapInteracting(true);
    };

    const handleDragEnd = () => {
      console.log('🖱️ User stops dragging');
      setIsMapInteracting(false);
      setLastInteractionTime(Date.now());
    };

    const handleZoomStart = () => {
      console.log('🔍 User starts zooming');
      setIsMapInteracting(true);
    };

    const handleZoomEnd = () => {
      console.log('🔍 User stops zooming');
      setIsMapInteracting(false);
      setLastInteractionTime(Date.now());
    };

    map.on('dragstart', handleDragStart);
    map.on('dragend', handleDragEnd);
    map.on('zoomstart', handleZoomStart);
    map.on('zoomend', handleZoomEnd);

    return () => {
      map.off('dragstart', handleDragStart);
      map.off('dragend', handleDragEnd);
      map.off('zoomstart', handleZoomStart);
      map.off('zoomend', handleZoomEnd);
    };
  }, [map]);

  // LOGIC CHÍNH: Fetch pods chỉ theo center position
  useEffect(() => {
    console.log("Center changed:", currentMapCenter);
    if (currentMapCenter && shouldFetchPods(currentMapCenter)) {
      console.log("Fetching pods for center:", currentMapCenter);
      debouncedFetchPodsRef.current(currentMapCenter, radius);
    }
  }, [currentMapCenter, radius, shouldFetchPods]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      debouncedCenterMapRef.current.cancel();
      debouncedFetchPodsRef.current.cancel();
    };
  }, []);

  return {
    lastSearchCenter: currentLocation,
    currentLocation,
    isUserOutOfView,
    pods,
    error,
    loading,
    setPods,
  };
}

export default useLocationTracking;