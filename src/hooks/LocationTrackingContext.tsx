// LocationTrackingContext.js
import React, { createContext, useContext, ReactNode } from 'react';
import { useLocationTracking } from './useLocationTracking';
import { useMapStore } from '@/features/map/stores/map.store';
import { useRadiusStore } from '@/features/map/stores/radius.store';

interface LocationTrackingProviderProps {
  children: ReactNode;
}

const LocationTrackingContext = createContext<ReturnType<typeof useLocationTracking> | undefined>(undefined);

export const LocationTrackingProvider = ({ children }: LocationTrackingProviderProps) => {
  const { currentMapCenter } = useMapStore();
  const { radius } = useRadiusStore();
  const locationTracking = useLocationTracking(radius, currentMapCenter);

  // Log để debug
  console.log('LocationTrackingProvider render:', {
    hasCurrentLocation: !!locationTracking.currentLocation,
    error: locationTracking.error
  });

  return (
    <LocationTrackingContext.Provider value={locationTracking}>
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