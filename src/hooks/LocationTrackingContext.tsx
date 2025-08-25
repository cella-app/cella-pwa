'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useLocationTracking } from './useLocationTracking';
import { useMapStore } from '@/features/map/stores/map.store';
import { useRadiusStore } from '@/features/map/stores/radius.store';
import { PodList } from '@/shared/data/models/Pod';
import { LocationData } from '@/shared/data/models/Location';

// Define context type
interface LocationTrackingContextType {
  lastSearchCenter: LocationData | null;
  currentLocation: LocationData | null;
  isUserOutOfView: boolean;
  pods: PodList[];
  error: string | null;
  loading: boolean;
  setPods: (pods: PodList[]) => void;
  setStartTracking: (value: boolean) => void;
}

const LocationTrackingContext = createContext<LocationTrackingContextType | undefined>(undefined);

interface LocationTrackingProviderProps {
  children: ReactNode;
}

export const LocationTrackingProvider = ({ children }: LocationTrackingProviderProps) => {
  const { currentMapCenter } = useMapStore();
  const { radius } = useRadiusStore();
  const [startTracking, setStartTracking] = useState(false); // Default to false during SSR

  // Initialize startTracking based on localStorage and permission state (client-side only)
  useEffect(() => {
    console.log("useEffect in LocationTrackingProvider called");

    if (typeof window === 'undefined') return; // Skip during SSR

    const alreadyAsked = localStorage.getItem('locationPermissionAsked');
    const storedStartTracking = localStorage.getItem('startTracking') === 'true';

    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted') {
          setStartTracking(true);
        } else if (result.state === 'denied' || result.state === 'prompt') {
          setStartTracking(storedStartTracking && alreadyAsked === 'true');
        }
      });
    } else {
      setStartTracking(storedStartTracking && alreadyAsked === 'true');
    }
  }, []);

  // Sync startTracking with localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('startTracking', startTracking.toString());
    }
  }, [startTracking]);

  const locationTracking = useLocationTracking(radius, currentMapCenter, startTracking);

  // Log để debug
  console.log('LocationTrackingProvider render:', {
    hasCurrentLocation: !!locationTracking.currentLocation,
    error: locationTracking.error,
    startTracking,
  });

  return (
    <LocationTrackingContext.Provider value={{ ...locationTracking, setStartTracking }}>
      {children}
    </LocationTrackingContext.Provider>
  );
};

export const useLocationTrackingContext = () => {
  const context = useContext(LocationTrackingContext);
  if (!context) {
    throw new Error('useLocationTrackingContext must be used within a LocationTrackingProvider');
  }
  return context;
};