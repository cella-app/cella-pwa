import React, { createContext, useContext, ReactNode } from 'react';
import { useLocationTracking } from './useLocationTracking';
import { PodList } from '@/shared/data/models/Pod';

interface LocationTrackingProviderProps {
  children: ReactNode;
  radius?: number;
}

const LocationTrackingContext = createContext<ReturnType<typeof useLocationTracking> & { setPods: (pods: PodList[]) => void } | undefined>(undefined);

export const LocationTrackingProvider = ({ children, radius = 600 }: LocationTrackingProviderProps) => {
  const locationTracking = useLocationTracking(radius);
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
