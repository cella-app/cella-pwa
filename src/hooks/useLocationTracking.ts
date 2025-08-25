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
  
  // 🔍 DEBUG: Check hook được gọi
  console.log('🎣 useLocationTracking hook called with:', {
    radius,
    startTracking,
    hasCurrentMapCenter: !!currentMapCenter,
    hasMap: !!map
  });

  const [isUserOutOfView, setIsUserOutOfView] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isMapInteracting, setIsMapInteracting] = useState(false);

  const watchIdRef = useRef<number | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFetchedCenter = useRef<LocationData | null>(null); // Center của lần fetch trước
  const lastSavedUserLocation = useRef<LocationData | null>(null); // User location đã được save để kiểm tra movement

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
  let lastUpdate = Date.now();
  const handleLocationSuccess = useCallback(
    (position: GeolocationPosition) => {
      const now = Date.now();
      console.log(`Update after: ${now - lastUpdate}ms`);
      lastUpdate = now;
      console.log("Geolocation success",{
        accuracy: position.coords.accuracy,        // Độ chính xác (m)
        altitude: position.coords.altitude,        // Có GPS không
        altitudeAccuracy: position.coords.altitudeAccuracy,
        heading: position.coords.heading,          // Hướng di chuyển
        speed: position.coords.speed               // Tốc độ
      });
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
    console.log('🌍 Geolocation useEffect triggered');

    // Check geolocation support
    if (!navigator.geolocation) {
      console.error('❌ Geolocation not supported');
      setError('Geolocation is not supported by your browser');
      return;
    }
    console.log('✅ Navigator.geolocation exists');

    // Check HTTPS (required by some browsers)
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      console.warn('⚠️ Geolocation may require HTTPS');
    }

    const cleanup = () => {
      console.log('🧹 Cleaning up geolocation watch');
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

    console.log('📍 Starting geolocation.watchPosition...');

    try {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          console.log('✅ Geolocation SUCCESS:', position);
          handleLocationSuccess(position);
        },
        (error) => {
          console.error('❌ Geolocation ERROR:', error);
          handleGeolocationError(error);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 10000,
        }
      );

      console.log('🎯 WatchPosition started with ID:', watchId);
      watchIdRef.current = watchId;
    } catch (error) {
      console.error('💥 Exception starting watchPosition:', error);
      setError('Failed to start location tracking');
    }

    return cleanup;
  }, [handleLocationSuccess, handleGeolocationError]);

  // Define the actual (non-debounced) center map function
  const centerMapInternal = useCallback(
    (location: LocationData) => {
      if (map && !isMapInteracting && currentMapCenter) {
        // Chỉ center map khi user và center trong valid range
        if (isUserCenterInValidRange(location, currentMapCenter)) {
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
    [map, isMapInteracting, currentMapCenter, isUserCenterInValidRange]
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

    const handleDragStart = () => setIsMapInteracting(true);
    const handleDragEnd = () => setIsMapInteracting(false);
    const handleZoomStart = () => setIsMapInteracting(true);
    const handleZoomEnd = () => setIsMapInteracting(false);

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

  useEffect(() => {
    if (currentLocation) {
      console.log('📱 Current location updated:', currentLocation);
    }
  }, [currentLocation]);

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