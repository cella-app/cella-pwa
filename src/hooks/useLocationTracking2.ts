import { useState, useEffect, useCallback, useRef } from 'react';
import L from 'leaflet';
import { useLocationStore } from '@/features/map/stores/location.store';
import { LocationData } from '@/shared/data/models/Location';
import { calculateDistance } from '@/shared/utils/location';
import { useGettingPodsConditionStore } from '@/features/pods/stores/gettingPodsCondition.store';
import { getPodsNearMe } from '@/features/pods/pods.action';
import { PodList } from '@/shared/data/models/Pod';
const RETRY_DELAY = 5000;

const getAllowedCenterThreshold = (radius: number): number => {
  if (radius <= 600) return 10;
  if (radius <= 1000) return 20;
  if (radius <= 2500) return 45;
  if (radius <= 5000) return 90;
  if (radius <= 20000) return 200;
  return 250;
};

const getAllowedToGetPodsThreshold = (radius: number): number => {
  if (radius <= 600) return 50;
  if (radius <= 1000) return 100;
  if (radius <= 2500) return 150;
  if (radius <= 5000) return 300;
  if (radius <= 20000) return 1000;
  return 1200;
};

const shouldGetPods = (
  curLocation: LocationData,
  lastLocation: LocationData,
  radius: number
): boolean => {
  const distanceFromLastFetch = calculateDistance(
    curLocation.latitude,
    curLocation.longitude,
    lastLocation.latitude,
    lastLocation.longitude
  );
  const threshold = getAllowedToGetPodsThreshold(radius);
  return distanceFromLastFetch >= threshold;
};

export function useLocationTracking(
  radius: number = 600,
  currentMapCenter?: LocationData | null,
  map?: L.Map,
) {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [lastLocation, setLastLocation] = useState<LocationData | null>(null);
  const [adjustedCenter, setAdjustedCenter] = useState<LocationData | null>(null);
  const [isUserOutOfView, setIsUserOutOfView] = useState<boolean>(false);
  const [pods, setPods] = useState<PodList[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const watchIdRef = useRef<number | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { setLocation } = useLocationStore();
  const { changeState } = useGettingPodsConditionStore();

  const fetchPods = useCallback(
    async (lat: number, lng: number) => {
      try {
        setLoading(true);
        setError(null);

        const response = await getPodsNearMe({
          latitude: lat,
          longitude: lng,
          radius,
        });

        if (response?.data?.pods) {
          setPods(response.data.pods);
        } else {
          console.warn('Invalid response format:', response);
          setError('Invalid response from server');
        }
      } catch (err) {
        console.error('Error fetching pods:', err);
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch pods';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [radius]
  );

  const checkUserOutOfView = useCallback(() => {
    if (!map || !currentLocation) {
      setIsUserOutOfView(false);
      return;
    }
    try {
      const bounds = map.getBounds();
      setIsUserOutOfView(
        !bounds.contains([currentLocation.latitude, currentLocation.longitude])
      );
    } catch (e) {
      console.error('checkUserOutOfView error', e);
      setIsUserOutOfView(false);
    }
  }, [map, currentLocation]);

  const handleNewPosition = useCallback(
    (loc: LocationData) => {
      setCurrentLocation(loc);
      setLocation([loc.latitude, loc.longitude]);

      let mapCenterLatLng: LocationData | null = null;

      if (currentMapCenter) {
        // Trường hợp là LocationData
        mapCenterLatLng = {
          latitude: currentMapCenter.latitude,
          longitude: currentMapCenter.longitude,
        };
      } else if (map) {
        // Trường hợp là LatLng từ Leaflet
        const mc = map.getCenter();
        mapCenterLatLng = {
          latitude: mc.lat,
          longitude: mc.lng,
        };
      }

      if (!mapCenterLatLng) {
        setAdjustedCenter(loc);
        if (map) {
          try {
            map.setView([loc.latitude, loc.longitude], map.getZoom());
          } catch { }
        }
        return;
      }

      const distance = calculateDistance(
        loc.latitude,
        loc.longitude,
        mapCenterLatLng.latitude,
        mapCenterLatLng.longitude
      );
      const threshold = getAllowedCenterThreshold(radius);

      if (distance <= threshold) {
        changeState(false);
        setAdjustedCenter(loc);

        if (map) {
          try {
            map.setView([loc.latitude, loc.longitude], map.getZoom());
          } catch { }
        }

        if (!lastLocation || shouldGetPods(loc, lastLocation, radius)) {
          fetchPods(loc.latitude, loc.longitude);
        }
      } else {
        changeState(true);
        setAdjustedCenter(mapCenterLatLng);
      }

      setLastLocation(loc);
    },
    [map, radius, currentMapCenter,lastLocation, fetchPods, setLocation, changeState]
  );

  const handleLocationSuccess = useCallback(
    (position: GeolocationPosition) => {
      const newLocation: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      handleNewPosition(newLocation);
      setError(null);
    },
    [handleNewPosition]
  );

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
          return;
      }
      setError(errorMessage);
    },
    [handleLocationSuccess]
  );

  const startTracking = useCallback(() => {
    if (!('geolocation' in navigator)) {
      console.error('Geolocation is not supported by your browser');
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const loc: LocationData = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        handleNewPosition(loc);
      },
      handleGeolocationError,
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
  }, [handleNewPosition, handleGeolocationError]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    checkUserOutOfView();
  }, [currentLocation, map, checkUserOutOfView]);

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
