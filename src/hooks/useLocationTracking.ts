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

  const watchIdRef = useRef<number | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFetchedCenter = useRef<LocationData | null>(null); // Lưu center của lần fetch trước

  const { setLocation, currentLocation, lastLocation, setLastLocation } = useLocationStore();
  const { setStateLocationDiffValid } = useMapConditionStore();
  const { pods, setPods } = usePodStore();

  // Debounced fetchPods để tránh gọi API nhiều lần
  const debouncedFetchPods = useCallback(
    debounce(async (center: LocationData, rad: number) => {
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
    }, FETCH_DEBOUNCE_TIME),
    [setPods]
  );

  // Kiểm tra xem có nên fetch pods không
  const shouldFetchPods = useCallback(
    (center: LocationData) => {
      if (!center) return false;
      if (!lastFetchedCenter.current) return true; // Fetch lần đầu
      const threshold = getAllowedToGetPodsThreshold(radius);
      const diff = calculateDistanceNew(center, lastFetchedCenter.current);
      return diff >= threshold;
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
      console.log("OK2", position)
      const newLocation: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      const threshold = getAllowedToGetPodsThreshold(radius);
      if (!lastLocation) {
        setLastLocation(newLocation);
        setStateLocationDiffValid(true);
      } else {
        const diff = calculateDistanceNew(newLocation, lastLocation);
        setStateLocationDiffValid(diff >= threshold);
        if (diff >= threshold) {
          setLastLocation(newLocation);
        }
      }

      setLocation(newLocation);
      setError(null);
    },
    [lastLocation, radius, setLocation, setLastLocation, setStateLocationDiffValid]
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
        maximumAge: 30000,
        timeout: 10000,
      }
    );

    watchIdRef.current = watchId;

    return cleanup;
  }, [handleLocationSuccess, handleGeolocationError, startTracking]);

  // Debounced function to center the map smoothly
  const centerMap = useCallback(
    debounce((location: LocationData) => {
      if (map && !isMapInteracting && currentMapCenter) {
        // Kiểm tra khoảng cách giữa center và location
        const threshold = getAllowedCenterThreshold(radius);
        const distanceToCenter = calculateDistanceNew(location, currentMapCenter);
        if (distanceToCenter <= threshold) {
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
    }, DEBOUNCE_TIME),
    [map, isMapInteracting, currentMapCenter, radius]
  );

  // Auto-center và check out of view khi location thay đổi
  useEffect(() => {
    if (currentLocation) {
      centerMap(currentLocation);
      checkUserOutOfView();
    }
  }, [currentLocation, centerMap, checkUserOutOfView]);

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

  // Fetch pods khi currentMapCenter hoặc radius thay đổi
  useEffect(() => {
    if (currentMapCenter && shouldFetchPods(currentMapCenter)) {
      debouncedFetchPods(currentMapCenter, radius);
    }
  }, [currentMapCenter, radius, debouncedFetchPods, shouldFetchPods]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      centerMap.cancel();
      debouncedFetchPods.cancel();
    };
  }, [centerMap, debouncedFetchPods]);

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