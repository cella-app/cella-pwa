import { useState, useEffect, useCallback, useRef } from 'react';
import L from 'leaflet';
import { useLocationStore } from '@/features/map/stores/location.store';
import { LocationData } from '@/shared/data/models/Location';
import { calculateDistanceNew, getAllowedToGetPodsThreshold, getAllowedCenterThreshold, getNoiseThreshold } from '@/shared/utils/location';
import { useMapConditionStore } from '@/features/map/stores/mapCondition.store';
import { usePodStore } from '@/features/pods/stores/pod.store';
import { getPodsNearMe } from '@/features/pods/pods.action';
import debounce from 'lodash/debounce';
import { useEventStore } from '@/features/map/stores/event.store';
import { useLoadingStore } from '@/features/map/stores/loading.store';
import { useMapStore } from '@/features/map/stores/map.store';

const RETRY_DELAY = 500;
const DEBOUNCE_TIME = 300;
const FETCH_DEBOUNCE_TIME = 500; // Reduced from 1000ms to 500ms for faster response
const MAX_GPS_ACCURACY = 50; // Only accept GPS readings with accuracy better than 50 meters

export function useLocationTracking(
  radius: number = 1200, // Doubled from 600 to 1200
  startTracking: boolean = false,
  map?: L.Map,
) {
  const [isUserOutOfView, setIsUserOutOfView] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFetchedCenter = useRef<LocationData | null>(null);
  const lastSavedUserLocation = useRef<LocationData | null>(null);

  const { setLocation, currentLocation, lastLocation, setLastLocation } = useLocationStore();
  const { setStateLocationDiffValid } = useMapConditionStore();
  const { pods, setPods } = usePodStore();
  const { changeState, changeStateShowLoader } = useEventStore()
  const { setLoading } = useLoadingStore()
  const { currentMapCenter } = useMapStore(); // Get map from store
  

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

  // Fetch pods function
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
          lastFetchedCenter.current = center;
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

  // Wrapper function that shows loading immediately before debounced fetch
  const fetchPodsWithImmediateLoading = useCallback(
    (center: LocationData, rad: number) => {
      setLoading(true); // Show loading immediately when fetch is scheduled
      debouncedFetchPodsRef.current(center, rad);
    },
    [setLoading]
  );

  const debouncedFetchPodsRef = useRef(debounce(fetchPodsInternal, FETCH_DEBOUNCE_TIME));

  useEffect(() => {
    debouncedFetchPodsRef.current = debounce(fetchPodsInternal, FETCH_DEBOUNCE_TIME);
    return () => {
      debouncedFetchPodsRef.current.cancel();
    };
  }, [fetchPodsInternal]);

  // Kiểm tra có nên fetch pods không
  const shouldFetchPods = useCallback(
    (center: LocationData): boolean => {
      console.log("abc")
      if (!center) return false;
      if (!lastFetchedCenter.current) return true;
      const threshold = getAllowedCenterThreshold(radius);
      const distance = calculateDistanceNew(center, lastFetchedCenter.current);
      return distance >= threshold || distance <= 10;
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
      // Check if map is properly initialized
      if (!map.getContainer()) {
        console.log('Map not ready yet');
        setIsUserOutOfView(false);
        return;
      }
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
      // Filter out inaccurate GPS readings to prevent jumpy behavior
      const accuracy = position.coords.accuracy;
      if (accuracy > MAX_GPS_ACCURACY) {
        console.log(`🛰️ GPS reading rejected - poor accuracy: ${accuracy.toFixed(0)}m (max: ${MAX_GPS_ACCURACY}m)`);
        return; // Ignore inaccurate readings
      }

      const newLocation: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      console.log(`🛰️ GPS reading accepted - accuracy: ${accuracy.toFixed(0)}m`);
      setLocation(newLocation);
      setError(null);

      if (shouldUpdateUserLocation(newLocation)) {
        setLastLocation(newLocation);
        setStateLocationDiffValid(true);
        lastSavedUserLocation.current = newLocation;
      } else {
        if (lastLocation) {
          const threshold = getAllowedToGetPodsThreshold(radius);
          const diff = calculateDistanceNew(newLocation, lastLocation);
          setStateLocationDiffValid(diff >= threshold);
        } else {
          setLastLocation(newLocation);
          setStateLocationDiffValid(true);
          lastSavedUserLocation.current = newLocation;
        }
      }
    },
    [setLocation, setLastLocation, setStateLocationDiffValid, shouldUpdateUserLocation, lastLocation, radius]
  );

  // Handle geolocation errors
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
        maximumAge: 5000, // Allow cached position up to 5s to reduce GPS jumping
        timeout: 10000,
      }
    );

    watchIdRef.current = watchId;

    return cleanup;
  }, [handleLocationSuccess, handleGeolocationError, startTracking]);

  // Kiểm tra user có di chuyển đủ xa để cần center map không (tránh GPS noise)
  const shouldCenterMap = useCallback(
    (newLocation: LocationData, currentCenter: LocationData): boolean => {
      const GPS_NOISE_THRESHOLD = getNoiseThreshold(radius);
      const distance = calculateDistanceNew(newLocation, currentCenter);
      return distance >= GPS_NOISE_THRESHOLD;
    },
    [radius]
  );

  // Center map function - đơn giản hóa logic với GPS noise filter
  const centerMapInternal = useCallback(
    (location: LocationData) => {
      if (map && currentMapCenter) {
        // Check: center trong phạm vi với user VÀ user di chuyển đủ xa
        if (isUserCenterInValidRange(location, currentMapCenter) &&
          shouldCenterMap(location, currentMapCenter)) {
          console.log("Centering map - user moved significantly:", location);
          try {
            map.flyTo([location.latitude, location.longitude], map.getZoom(), {
              duration: 0.5,
              easeLinearity: 0.25,
            });
          } catch (err) {
            console.error('Error centering map:', err);
          }
        }
      }
    },
    [map, currentMapCenter, isUserCenterInValidRange, shouldCenterMap]
  );

  const debouncedCenterMapRef = useRef(debounce(centerMapInternal, DEBOUNCE_TIME));

  useEffect(() => {
    debouncedCenterMapRef.current = debounce(centerMapInternal, DEBOUNCE_TIME);
    return () => {
      debouncedCenterMapRef.current.cancel();
    };
  }, [centerMapInternal]);

  // Auto-center khi location thay đổi
  useEffect(() => {
    if (currentLocation) {
      debouncedCenterMapRef.current(currentLocation);
      checkUserOutOfView();
    }
  }, [currentLocation, checkUserOutOfView]);

  // LOGIC CHÍNH: Fetch khi user location thay đổi và center trong phạm vi
  useEffect(() => {
    if (!currentLocation || !currentMapCenter) return;

    // Chỉ fetch khi user và center trong phạm vi hợp lệ
    if (isUserCenterInValidRange(currentLocation, currentMapCenter)) {
      changeState(false);
      changeStateShowLoader(false);
      if (shouldFetchPods(currentMapCenter)) {
        console.log("Fetching pods - user in range with center:", currentMapCenter);
        fetchPodsWithImmediateLoading(currentMapCenter, radius);
      }
    }
  }, [currentLocation, radius, shouldFetchPods, isUserCenterInValidRange, currentMapCenter, changeState, changeStateShowLoader, fetchPodsWithImmediateLoading]);

  // Track last processed center to prevent infinite flyTo loops
  const lastProcessedCenter = useRef<LocationData | null>(null);

  // LOGIC BỔ SUNG: Khi center thay đổi và trong khoảng hợp lệ với user thì fly về user (với GPS noise filter)
  useEffect(() => {
    if (!currentLocation || !currentMapCenter || !map) return;

    // Prevent processing the same center multiple times
    if (lastProcessedCenter.current &&
        lastProcessedCenter.current.latitude === currentMapCenter.latitude &&
        lastProcessedCenter.current.longitude === currentMapCenter.longitude) {
      return;
    }

    // Khi center thay đổi, nếu nó trong khoảng hợp lệ với user VÀ đủ xa để đáng fly thì fly về user
    if (isUserCenterInValidRange(currentLocation, currentMapCenter)) {
      if (shouldCenterMap(currentLocation, currentMapCenter)) {
        console.log("Center in range with user - flying to user location:", currentLocation);
        lastProcessedCenter.current = currentMapCenter; // Mark as processed
        try {
          map.flyTo([currentLocation.latitude, currentLocation.longitude], map.getZoom(), {
            duration: 0.5,
            easeLinearity: 0.25,
          });
          // Fetch với user location thay vì center
          if (shouldFetchPods(currentLocation)) {
            console.log("Fetching pods at user location:", currentLocation);
            fetchPodsWithImmediateLoading(currentLocation, radius);
          }
        } catch (err) {
          console.error('Error flying to user location:', err);
        }
      } else {
        // Update last processed even if we don't fly, to prevent checking again
        lastProcessedCenter.current = currentMapCenter;
      }
    }
  }, [currentMapCenter, map, currentLocation, isUserCenterInValidRange, shouldCenterMap, shouldFetchPods, radius, fetchPodsWithImmediateLoading]);

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
    setPods,
  };
}

export default useLocationTracking;
