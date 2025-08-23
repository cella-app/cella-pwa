import React, { createContext, useContext, ReactNode } from 'react';
import { useLocationTracking } from './useLocationTracking3';
import { PodList } from '@/shared/data/models/Pod';
import { useMapStore } from '@/features/map/stores/map.store';

interface LocationTrackingProviderProps {
  children: ReactNode;
  radius?: number;
}

const LocationTrackingContext = createContext<ReturnType<typeof useLocationTracking> & { setPods: (pods: PodList[]) => void } | undefined>(undefined);

export const LocationTrackingProvider = ({ children, radius = 600 }: LocationTrackingProviderProps) => {
  const { currentMapCenter } = useMapStore();
  const locationTracking = useLocationTracking(radius, currentMapCenter);
  
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
