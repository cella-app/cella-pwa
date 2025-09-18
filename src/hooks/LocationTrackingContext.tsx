'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useLocationTracking } from './useLocationTracking';
import { useMapStore } from '@/features/map/stores/map.store';
import { useRadiusStore } from '@/features/map/stores/radius.store';
import { PodList } from '@/shared/data/models/Pod';
import { LocationData } from '@/shared/data/models/Location';

interface LocationTrackingContextType {
  lastSearchCenter: LocationData | null;
  currentLocation: LocationData | null;
  isUserOutOfView: boolean;
  pods: PodList[];
  error: string | null;
  setPods: (pods: PodList[]) => void;
  setStartTracking: (value: boolean) => void;
}

const LocationTrackingContext = createContext<LocationTrackingContextType | undefined>(undefined);

interface LocationTrackingProviderProps {
  children: ReactNode;
}

export const LocationTrackingProvider = ({ children }: LocationTrackingProviderProps) => {
  const { map } = useMapStore();
  const { radius } = useRadiusStore();
  const [startTracking, setStartTracking] = useState(false);

  useEffect(() => {
    console.log("useEffect in LocationTrackingProvider called");

    if (typeof window === 'undefined') return;

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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('startTracking', startTracking.toString());
    }
  }, [startTracking]);

  const locationTracking = useLocationTracking(radius, startTracking, map || undefined);

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
