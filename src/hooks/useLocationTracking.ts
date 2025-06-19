import { useState, useEffect, useCallback, useRef } from 'react';
import { getPodsNearMe } from '@/features/pods/pods.action';
import { PodList } from '@/shared/data/models/Pod';

interface LocationData {
  latitude: number;
  longitude: number;
}

export const useLocationTracking = (radius: number = 1000) => {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [pods, setPods] = useState<PodList[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [centroid, setCentroid] = useState<[number, number] | null>(null);
  const [lastLocation, setLastLocation] = useState<LocationData | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchPods = useCallback(async (lat: number, lng: number) => {
    try {
      setLoading(true);
      const response = await getPodsNearMe({ latitude: lat, longitude: lng, radius });

      if (response) {
        setPods(response.data.pods);
        setLastLocation({ latitude: lat, longitude: lng });

        if (Array.isArray(response.meta?.centroid)) {
          setCentroid([response.meta.centroid[0], response.meta.centroid[1]]);
        }
      }
    } catch (err) {
      console.error('Error fetching pods:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch pods');
    } finally {
      setLoading(false);
    }
  }, [radius]);

  const shouldFetch = useCallback((newLoc: LocationData) => {
    if (!lastLocation || !centroid) return true;

    const moved = newLoc.latitude !== lastLocation.latitude || newLoc.longitude !== lastLocation.longitude;
    if (!moved) return false;

    // Tính khoảng cách giữa newLoc và centroid
    const R = 6371e3; // Earth radius in meters
    const φ1 = (centroid[1] * Math.PI) / 180;
    const φ2 = (newLoc.latitude * Math.PI) / 180;
    const Δφ = ((newLoc.latitude - centroid[1]) * Math.PI) / 180;
    const Δλ = ((newLoc.longitude - centroid[0]) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance > radius;
  }, [lastLocation, centroid, radius]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    const handleSuccess = (position: GeolocationPosition) => {
      const newLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      setCurrentLocation(newLocation);

      if (shouldFetch(newLocation)) {
        if (fetchTimeoutRef.current) {
          clearTimeout(fetchTimeoutRef.current);
        }
        fetchTimeoutRef.current = setTimeout(() => {
          fetchPods(newLocation.latitude, newLocation.longitude);
        }, 500);
      }
    };

    const handleError = (error: GeolocationPositionError) => {
      console.error('Geolocation error:', error);
      setError('Error tracking location');

      // Retry nếu lỗi là timeout
      if (error.code === 3) {
        setTimeout(() => {
          navigator.geolocation.getCurrentPosition(
            handleSuccess,
            (err) => console.error('Retry geolocation error:', err),
            {
              enableHighAccuracy: true,
              timeout: 10000,
            }
          );
        }, 5000);
      }
    };

    const watchId = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 30000,
      }
    );

    watchIdRef.current = watchId;

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [fetchPods, shouldFetch]);

  return {
    currentLocation,
    pods,
    loading,
    error,
    lastSearchCenter: centroid,
  };
};
