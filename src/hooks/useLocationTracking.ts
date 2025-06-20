import { useState, useEffect, useCallback, useRef } from 'react';
import { getPodsNearMe } from '@/features/pods/pods.action';
import { PodList } from '@/shared/data/models/Pod';

interface LocationData {
  latitude: number;
  longitude: number;
}

// Constants for better maintainability
const EARTH_RADIUS_METERS = 6371e3;
const FETCH_DEBOUNCE_DELAY = 500;
const RETRY_DELAY = 5000;
const HIGH_ACCURACY_THRESHOLD = 20;
const WIFI_ACCURACY_THRESHOLD = 100;
const CELL_TOWER_ACCURACY_THRESHOLD = 1000;

export const useLocationTracking = (radius: number = 1000) => {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [pods, setPods] = useState<PodList[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [centroid, setCentroid] = useState<[number, number] | null>(null);
  const [lastLocation, setLastLocation] = useState<LocationData | null>(null);

  // Refs for cleanup
  const watchIdRef = useRef<number | null>(null);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const logCountRef = useRef(0);

  // Utility function to calculate distance between two points using Haversine formula
  const calculateDistance = useCallback((
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number => {
    // Convert degrees to radians
    const lat1Rad = (lat1 * Math.PI) / 180;
    const lat2Rad = (lat2 * Math.PI) / 180;
    const latDiff = ((lat2 - lat1) * Math.PI) / 180;
    const lngDiff = ((lng2 - lng1) * Math.PI) / 180;

    // Haversine formula
    const a = Math.sin(latDiff / 2) ** 2 +
      Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(lngDiff / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return EARTH_RADIUS_METERS * c;
  }, []);

  // Enhanced logging function
  const logPosition = useCallback((position: GeolocationPosition) => {
    const { latitude, longitude, accuracy } = position.coords;
    const timestamp = new Date(position.timestamp).toLocaleTimeString();

    let source = 'Unknown';
    if (accuracy < HIGH_ACCURACY_THRESHOLD) {
      source = '🚀 GPS or GPS + WiFi';
    } else if (accuracy < WIFI_ACCURACY_THRESHOLD) {
      source = '📶 WiFi or Cell Tower';
    } else if (accuracy < CELL_TOWER_ACCURACY_THRESHOLD) {
      source = '📡 Cell tower (low-res)';
    } else {
      source = '🌍 IP-based or Estimated';
    }

    console.log(`[${++logCountRef.current}] @${timestamp}`);
    console.log(`- Location: (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`);
    console.log(`- Accuracy: ~${accuracy.toFixed(1)} meters`);
    console.log(`- Source: ${source}`);
    console.log('---------------------------');
  }, []);

  // Optimized fetch function with better error handling
  const fetchPods = useCallback(async (lat: number, lng: number) => {
    try {
      setLoading(true);
      setError(null); // Clear previous errors

      const response = await getPodsNearMe({
        latitude: lat,
        longitude: lng,
        radius
      });

      if (response?.data?.pods) {
        setPods(response.data.pods);
        setLastLocation({ latitude: lat, longitude: lng });

        // More robust centroid handling
        if (Array.isArray(response.meta?.centroid) && response.meta.centroid.length >= 2) {
          setCentroid([response.meta.centroid[0], response.meta.centroid[1]]);
        }
      } else {
        console.warn('Invalid response format:', response);
        setError('Invalid response from server');
      }
    } catch (err) {
      console.error('Error fetching pods:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch pods';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [radius]);

  const shouldFetch = useCallback((newLoc: LocationData): boolean => {
    if (!lastLocation || !centroid) {
      return true;
    }

    const latChanged = Math.abs(newLoc.latitude - lastLocation.latitude) > 0.000001;
    const lngChanged = Math.abs(newLoc.longitude - lastLocation.longitude) > 0.000001;

    if (!latChanged && !lngChanged) {
      return false;
    }

    const distance = calculateDistance(
      centroid[1], // centroid lat
      centroid[0], // centroid lng
      newLoc.latitude,
      newLoc.longitude
    );

    return distance > radius;
  }, [lastLocation, centroid, radius, calculateDistance]);

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
        // Retry on timeout
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }
        retryTimeoutRef.current = setTimeout(() => {
          navigator.geolocation.getCurrentPosition(
            handleLocationSuccess,
            (retryError) => {
              console.error('Retry geolocation error:', retryError);
              setError('Failed to get location after retry');
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 30000,
            }
          );
        }, RETRY_DELAY);
        break;
    }

    setError(errorMessage);
  }, []);

  const handleLocationSuccess = useCallback((position: GeolocationPosition) => {
    const newLocation: LocationData = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };

    logPosition(position);
    console.log('[watchPosition] New location:', newLocation);

    setCurrentLocation(newLocation);
    setError(null); 

    if (shouldFetch(newLocation)) {
      console.log('[shouldFetch] Calling API...');

      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }

      fetchTimeoutRef.current = setTimeout(() => {
        fetchPods(newLocation.latitude, newLocation.longitude);
      }, FETCH_DEBOUNCE_DELAY);
    } else {
      console.log('[shouldFetch] Inside radius, skipping API call');
    }
  }, [logPosition, shouldFetch, fetchPods]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    const cleanup = () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };

    cleanup();

    navigator.geolocation.getCurrentPosition(
      handleLocationSuccess,
      handleGeolocationError,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    const watchId = navigator.geolocation.watchPosition(
      handleLocationSuccess,
      handleGeolocationError,
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000,
      }
    );

    watchIdRef.current = watchId;

    return cleanup;
  }, [handleLocationSuccess, handleGeolocationError]);

  useEffect(() => {
    if (currentLocation && lastLocation) {
      setCentroid(null);
      setLastLocation(null);
    }
  }, [radius, currentLocation, lastLocation]);

  return {
    currentLocation,
    pods,
    loading,
    error,
    lastSearchCenter: centroid,
  };
};