import { useState, useEffect, useCallback, useRef } from 'react';
import L from 'leaflet';
import { useLocationStore } from '@/features/map/stores/location.store';
import { LocationData } from '@/shared/data/models/Location';
import { calculateDistanceNew, getAllowedToGetPodsThreshold, getAllowedCenterThreshold } from '@/shared/utils/location';
import { useGettingPodsConditionStore } from '@/features/pods/stores/gettingPodsCondition.store';
import { PodList } from '@/shared/data/models/Pod';
import debounce from 'lodash/debounce';

const RETRY_DELAY = 50;
const DEBOUNCE_TIME = 300; // Thời gian debounce (ms) để giới hạn tần suất cập nhật

export function useLocationTracking(
  radius: number = 600,
  currentMapCenter?: LocationData | null,
  map?: L.Map
) {
  const [adjustedCenter, setAdjustedCenter] = useState<LocationData | null>(null);
  const [isUserOutOfView, setIsUserOutOfView] = useState<boolean>(false);
  const [pods, setPods] = useState<PodList[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isMapInteracting, setIsMapInteracting] = useState(false); // Theo dõi tương tác người dùng

  const watchIdRef = useRef<number | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { setLocation, currentLocation, lastLocation, setLastLocation } = useLocationStore();
  const { changeState } = useGettingPodsConditionStore();

  // ✅ Check if user's location is within the map bounds
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

  // ✅ Handle successful geolocation
  const handleLocationSuccess = useCallback((position: GeolocationPosition) => {
    const newLocation: LocationData = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };

    const threshold = getAllowedToGetPodsThreshold(radius);

    if (!lastLocation) {
      setLastLocation(newLocation);
    } else {
      const diff = calculateDistanceNew(newLocation, lastLocation);
      if (diff >= threshold) {
        setLastLocation(newLocation);
      }
    }

    setLocation(newLocation);
    setError(null);
  }, [lastLocation, radius, setLocation, setLastLocation]);

  // ✅ Handle geolocation errors and retry
  const handleGeolocationError = useCallback((error: GeolocationPositionError) => {
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
        break;
    }

    setError(errorMessage);

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    retryTimeoutRef.current = setTimeout(() => {
      startTracking();
    }, RETRY_DELAY);
  }, []);

  // ✅ Start location tracking
  const startTracking = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    console.warn("OK nhé");

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      handleLocationSuccess,
      handleGeolocationError,
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000,
      }
    );
  }, [handleLocationSuccess, handleGeolocationError]);

  // ✅ Debounced function to center the map smoothly
  const centerMap = useCallback(
    debounce((location: LocationData) => {
      if (map && !isMapInteracting) {
        try {
          // Sử dụng flyTo để di chuyển mượt mà
          map.flyTo([location.latitude, location.longitude], map.getZoom(), {
            duration: 0.5, // Thời gian animation (giây)
            easeLinearity: 0.25, // Độ mượt của chuyển động
          });
          setAdjustedCenter(location);
        } catch (err) {
          console.error('Error centering map:', err);
        }
      }
    }, DEBOUNCE_TIME),
    [map, isMapInteracting]
  );

  // ✅ Auto-center the map when currentLocation changes
  useEffect(() => {
    if (currentLocation) {
      centerMap(currentLocation);
      checkUserOutOfView();
    }
  }, [currentLocation, centerMap, checkUserOutOfView]);

  // ✅ Track map interaction to disable auto-centering
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

  // ✅ Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }

      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }

      // Hủy debounce khi component unmount
      centerMap.cancel();
    };
  }, [centerMap]);

  useEffect(() => {
    if (currentMapCenter && currentLocation) {
      const threshold = getAllowedCenterThreshold(radius);
      const centerAndCurrentDiff = calculateDistanceNew(currentMapCenter, currentLocation)

      if (centerAndCurrentDiff > threshold) {
        setIsMapInteracting(true);
      }
    }
  }, [currentMapCenter])

  return {
    lastSearchCenter: currentLocation,
    currentLocation,
    adjustedCenter,
    isUserOutOfView,
    pods,
    error,
    loading,
    setPods,
    startTracking,
  };
}

export default useLocationTracking;