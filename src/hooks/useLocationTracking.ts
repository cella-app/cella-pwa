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
  const lastSearchCenterRef = useRef<[number, number] | null>(null);
  const isInitialFetchRef = useRef(true);
  const watchIdRef = useRef<number | null>(null);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchPods = useCallback(async (lat: number, lng: number) => {
    try {
      setLoading(true);
      const response = await getPodsNearMe({
        latitude: lat,
        longitude: lng,
        radius: radius
      });
      
      if (response) {
        setPods(response.pods);
        lastSearchCenterRef.current = [lng, lat];
      }
    } catch (err) {
      console.error('Error fetching pods:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch pods');
    } finally {
      setLoading(false);
    }
  }, [radius]);

  const checkAndUpdateLocation = useCallback((newLocation: LocationData) => {
    if (!lastSearchCenterRef.current || isInitialFetchRef.current) {
      isInitialFetchRef.current = false;
      return true;
    }

    const R = 6371e3; 
    const φ1 = (lastSearchCenterRef.current[1] * Math.PI) / 180;
    const φ2 = (newLocation.latitude * Math.PI) / 180;
    const Δφ = ((newLocation.latitude - lastSearchCenterRef.current[1]) * Math.PI) / 180;
    const Δλ = ((newLocation.longitude - lastSearchCenterRef.current[0]) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance > radius;
  }, [radius]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        // Only update currentLocation and fetch pods if location significantly changed or it's the initial fetch
        if (isInitialFetchRef.current || checkAndUpdateLocation(newLocation)) {
          setCurrentLocation(newLocation); // Only update state if needed

          if (fetchTimeoutRef.current) {
            clearTimeout(fetchTimeoutRef.current);
          }
          fetchTimeoutRef.current = setTimeout(() => {
            fetchPods(newLocation.latitude, newLocation.longitude);
          }, 500); // Debounce by 500ms

          isInitialFetchRef.current = false; // Reset after initial fetch
        } else {
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setError('Error tracking location');
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000, 
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
  }, [fetchPods, checkAndUpdateLocation]);

  return {
    currentLocation,
    pods,
    loading,
    error,
    lastSearchCenter: lastSearchCenterRef.current,
  };
}; 