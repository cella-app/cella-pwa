import { useState, useEffect, useCallback, useRef } from 'react';
import { getPodsNearMe } from '@/features/pods/pods.action';
import { PodList } from '@/shared/data/models/Pod';
import L from 'leaflet';
import { useLocationStore } from '@/features/map/stores/location.store';
import {
  FETCH_DEBOUNCE_DELAY,
  RETRY_DELAY,
  MOVEMENT_THRESHOLD,
} from '@/shared/config/location';
import { LocationData } from '@/shared/data/models/Location';
import { calculateDistance } from '@/shared/utils/location';

export const useLocationTracking = (
  radius: number = 600,
  currentMapCenter?: LocationData | null,
  map?: L.Map
) => {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [pods, setPods] = useState<PodList[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [centroid, setCentroid] = useState<[number, number] | null>(null);
  const [lastLocation, setLastLocation] = useState<LocationData | null>(null);
  const [isUserOutOfView, setIsUserOutOfView] = useState<boolean>(false);
  const [searchCenter, setSearchCenter] = useState<LocationData | null>(null);
  const [lastFarMovementCheck, setLastFarMovementCheck] = useState<LocationData | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

  const { setLocation } = useLocationStore();

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

  const updateSearchCenter = useCallback((newUserLocation: LocationData, mapCenter?: LocationData | null) => {
    if (!searchCenter) {
      const initialCenter = mapCenter || newUserLocation;
      setSearchCenter(initialCenter);
      setLastFarMovementCheck(newUserLocation);
      return initialCenter;
    }

    if (mapCenter) {
      const distanceMapCenterToCurrentSearch = calculateDistance(
        mapCenter.latitude,
        mapCenter.longitude,
        searchCenter.latitude,
        searchCenter.longitude
      );

      // If map center changes significantly, update search center to map
      if (distanceMapCenterToCurrentSearch > MOVEMENT_THRESHOLD * 1000) {
        setSearchCenter(mapCenter);
        setLastFarMovementCheck(newUserLocation);
        return mapCenter;
      }
    }

    // Calculate distance between user location and current search center
    const distanceToSearchCenter = calculateDistance(
      newUserLocation.latitude,
      newUserLocation.longitude,
      searchCenter.latitude,
      searchCenter.longitude
    );

    // Case 1: If distance < allowed center threshold, update search center to user
    if (distanceToSearchCenter < getAllowedCenterThreshold(radius)) {
      const updatedCenter = { ...newUserLocation };
      setSearchCenter(updatedCenter);
      setLastFarMovementCheck(newUserLocation); // Reset far movement check
      return updatedCenter;
    }

    // Case 2: If distance > allowed center threshold, check if user moved > allowed pods threshold
    if (lastFarMovementCheck) {
      const movementSinceLastCheck = calculateDistance(
        newUserLocation.latitude,
        newUserLocation.longitude,
        lastFarMovementCheck.latitude,
        lastFarMovementCheck.longitude
      );

      if (movementSinceLastCheck > getAllowedToGetPodsThreshold(radius)) {
        // User moved significantly, update search center to user location
        const updatedCenter = { ...newUserLocation };
        setSearchCenter(updatedCenter);
        setLastFarMovementCheck(newUserLocation);
        return updatedCenter;
      }
    }

    // Keep current search center
    return searchCenter;
  }, [searchCenter, lastFarMovementCheck, calculateDistance, radius]);

  const getLocationForFetch = useCallback((mapCenter?: LocationData | null): LocationData | null => {
    if (!currentLocation) return mapCenter || null;
    return updateSearchCenter(currentLocation, mapCenter);
  }, [currentLocation, updateSearchCenter]);

  const fetchPods = useCallback(async (lat: number, lng: number) => {
    try {
      setLoading(true);
      setError(null);

      const response = await getPodsNearMe({
        latitude: lat,
        longitude: lng,
        radius
      });

      console.warn("Fetch tracking");

      if (response?.data?.pods) {
        setPods(response.data.pods);
        setLastLocation({ latitude: lat, longitude: lng });

        if (response.meta?.centroid &&
          Array.isArray(response.meta.centroid) &&
          response.meta.centroid.length >= 2) {
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
    } catch (error) {
      console.error('Error checking user out of view:', error);
      setIsUserOutOfView(false);
    }
  }, [map, currentLocation]);

  const shouldFetch = useCallback((newLoc: LocationData): boolean => {
    if (!lastLocation || !searchCenter) return true;

    const newSearchCenter = updateSearchCenter(newLoc, currentMapCenter);
    const distanceFromLastFetch = calculateDistance(
      newSearchCenter.latitude,
      newSearchCenter.longitude,
      lastLocation.latitude,
      lastLocation.longitude
    );

    return distanceFromLastFetch > MOVEMENT_THRESHOLD * 1000;
  }, [lastLocation, searchCenter, updateSearchCenter, currentMapCenter, calculateDistance]);

  const handleLocationSuccess = useCallback((position: GeolocationPosition) => {
    const newLocation: LocationData = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };

    setCurrentLocation(newLocation);
    setLocation([newLocation.latitude, newLocation.longitude]);
    setError(null);

    // Check distance to searchCenter and pan map if within threshold
    if (map && searchCenter) {
      const distanceToSearchCenter = calculateDistance(
        newLocation.latitude,
        newLocation.longitude,
        searchCenter.latitude,
        searchCenter.longitude
      );

      if (distanceToSearchCenter < getAllowedCenterThreshold(radius)) {
        // Pan map to keep user at center
        map.panTo([newLocation.latitude, newLocation.longitude]);
      }
      // If distance > threshold, map center is locked (no panning)
    } else if (map && !searchCenter) {
      // Initial case: no searchCenter yet, pan to user location
      map.panTo([newLocation.latitude, newLocation.longitude]);
    }

    const fetchLocation = updateSearchCenter(newLocation, currentMapCenter);

    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = setTimeout(() => {
        if (fetchLocation) {
          fetchPods(fetchLocation.latitude, fetchLocation.longitude);
        }
      }, FETCH_DEBOUNCE_DELAY);
    } else if (shouldFetch(newLocation)) {
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = setTimeout(() => {
        const currentFetchLocation = updateSearchCenter(newLocation, currentMapCenter);
        if (currentFetchLocation) {
          fetchPods(currentFetchLocation.latitude, currentFetchLocation.longitude);
        }
      }, FETCH_DEBOUNCE_DELAY);
    }
  }, [shouldFetch, fetchPods, setLocation, updateSearchCenter, currentMapCenter, map, searchCenter, radius, calculateDistance]);

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
  }, [handleLocationSuccess]);

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

    const watchId = navigator.geolocation.watchPosition(
      handleLocationSuccess,
      handleGeolocationError,
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000
      }
    );

    watchIdRef.current = watchId;

    return cleanup;
  }, [handleLocationSuccess, handleGeolocationError]);

  useEffect(() => {
    if (currentLocation && map) {
      checkUserOutOfView();
    }
  }, [currentLocation, map, checkUserOutOfView]);

  useEffect(() => {
    setCentroid(null);
    setLastLocation(null);
    setSearchCenter(null);
    setLastFarMovementCheck(null);
    isInitializedRef.current = false;
  }, [radius]);

  return {
    currentLocation,
    pods,
    loading,
    error,
    lastSearchCenter: centroid,
    searchCenter,
    setPods,
    isUserOutOfView,
    getLocationForFetch,
  };
};