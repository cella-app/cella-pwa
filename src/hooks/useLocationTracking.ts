import { useState, useEffect, useCallback, useRef } from 'react';
import { getPodsNearMe } from '@/features/pods/pods.action';
import { PodList } from '@/shared/data/models/Pod';
import L from 'leaflet';
import { useLocationStore } from '@/features/pods/stores/location.store';
import {
  FETCH_DEBOUNCE_DELAY,
  RETRY_DELAY,
  MOVEMENT_THRESHOLD,
  CLOSE_DISTANCE_THRESHOLD,
  FAR_MOVEMENT_THRESHOLD
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

      // Nếu map center thay đổi đáng kể, cập nhật search center theo map
      if (distanceMapCenterToCurrentSearch > MOVEMENT_THRESHOLD * 1000) {
        setSearchCenter(mapCenter);
        // Reset far movement check khi user manually di chuyển map
        setLastFarMovementCheck(newUserLocation);
        return mapCenter;
      }
    }

    // Tính khoảng cách giữa vị trí user và search center hiện tại
    const distanceToSearchCenter = calculateDistance(
      newUserLocation.latitude,
      newUserLocation.longitude,
      searchCenter.latitude,
      searchCenter.longitude
    );

    // Case 1: Nếu khoảng cách < 10m, search center theo user
    if (distanceToSearchCenter < CLOSE_DISTANCE_THRESHOLD) {
      const updatedCenter = { ...newUserLocation };
      setSearchCenter(updatedCenter);
      setLastFarMovementCheck(newUserLocation); // Reset far movement check
      return updatedCenter;
    }

    // Case 2: Nếu khoảng cách > 10m, kiểm tra user có di chuyển > 50m từ lần check cuối
    if (lastFarMovementCheck) {
      const movementSinceLastCheck = calculateDistance(
        newUserLocation.latitude,
        newUserLocation.longitude,
        lastFarMovementCheck.latitude,
        lastFarMovementCheck.longitude
      );

      if (movementSinceLastCheck > FAR_MOVEMENT_THRESHOLD) {
        // User đã di chuyển > 50m, đưa search center về vị trí user
        const updatedCenter = { ...newUserLocation };
        setSearchCenter(updatedCenter);
        setLastFarMovementCheck(newUserLocation);
        return updatedCenter;
      }
    }

    // Giữ nguyên search center hiện tại
    return searchCenter;
  }, [searchCenter, lastFarMovementCheck, calculateDistance]);

  // Hàm quyết định vị trí nào sẽ được sử dụng để fetch pods
  const getLocationForFetch = useCallback((mapCenter?: LocationData | null): LocationData | null => {
    if (!currentLocation) return mapCenter || null;

    // Sử dụng logic mới để cập nhật search center
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

      console.warn("Fetch tracking")

      if (response?.data?.pods) {
        setPods(response.data.pods);
        setLastLocation({ latitude: lat, longitude: lng });

        // Handle centroid safely
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

  // Cập nhật shouldFetch để sử dụng search center
  const shouldFetch = useCallback((newLoc: LocationData): boolean => {
    if (!lastLocation || !searchCenter) return true;

    // Tính khoảng cách từ search center mới đến vị trí fetch cuối cùng
    const newSearchCenter = updateSearchCenter(newLoc, currentMapCenter);

    const distanceFromLastFetch = calculateDistance(
      newSearchCenter.latitude,
      newSearchCenter.longitude,
      lastLocation.latitude,
      lastLocation.longitude
    );

    // Fetch nếu search center đã thay đổi đáng kể
    return distanceFromLastFetch > MOVEMENT_THRESHOLD * 1000; // Convert to larger threshold for search center
  }, [lastLocation, searchCenter, updateSearchCenter, currentMapCenter, calculateDistance]);

  const handleLocationSuccess = useCallback((position: GeolocationPosition) => {
    const newLocation: LocationData = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };

    setCurrentLocation(newLocation);
    // Lưu vị trí hiện tại của người dùng vào location store
    setLocation([newLocation.latitude, newLocation.longitude]);
    setError(null);

    // Get the search center based on new logic
    const fetchLocation = updateSearchCenter(newLocation, currentMapCenter);

    // Always fetch on first location
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = setTimeout(() => {
        fetchPods(fetchLocation.latitude, fetchLocation.longitude);
      }, FETCH_DEBOUNCE_DELAY);
    } else if (shouldFetch(newLocation)) {
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = setTimeout(() => {
        const currentFetchLocation = updateSearchCenter(newLocation, currentMapCenter);
        fetchPods(currentFetchLocation.latitude, currentFetchLocation.longitude);
      }, FETCH_DEBOUNCE_DELAY);
    }
  }, [shouldFetch, fetchPods, setLocation, updateSearchCenter, currentMapCenter]);

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
        return; // Don't set error immediately for timeout
    }
    setError(errorMessage);
  }, [handleLocationSuccess]);

  // Initialize geolocation
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

  // Check if user is out of view when location or map changes
  useEffect(() => {
    if (currentLocation && map) {
      checkUserOutOfView();
    }
  }, [currentLocation, map, checkUserOutOfView]);

  // Reset state when radius changes
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