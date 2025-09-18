'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useLocationTracking } from './useLocationTracking';
import { useMapStore } from '@/features/map/stores/map.store';
import { useRadiusStore } from '@/features/map/stores/radius.store';
import { useLocationPermission } from './useLocationPermission';
import { PodList } from '@/shared/data/models/Pod';
import { LocationData } from '@/shared/data/models/Location';

interface LocationTrackingContextType {
  lastSearchCenter: LocationData | null;
  currentLocation: LocationData | null;
  isUserOutOfView: boolean;
  pods: PodList[];
  error: string | null;
  setPods: (pods: PodList[]) => void;

  // Permission related
  hasAskedPermission: boolean;
  isTrackingAllowed: boolean;
  needsUserDecision: boolean;
  permissionState: 'granted' | 'denied' | 'prompt' | 'unknown';
  isPermissionLoading: boolean;

  // Actions
  allowLocation: () => void;
  denyLocation: () => void;
  toggleTracking: (enabled: boolean) => void;
  resetPermission: () => void;
}

const LocationTrackingContext = createContext<LocationTrackingContextType | undefined>(undefined);

interface LocationTrackingProviderProps {
  children: ReactNode;
}

export const LocationTrackingProvider = ({ children }: LocationTrackingProviderProps) => {
  const { map } = useMapStore();
  const { radius } = useRadiusStore();

  // Use the centralized permission hook
  const {
    hasAskedPermission,
    isTrackingAllowed,
    needsUserDecision,
    permissionState,
    isLoading: isPermissionLoading,
    allowLocation,
    denyLocation,
    toggleTracking,
    resetPermission
  } = useLocationPermission();

  // Only start tracking if permission is explicitly allowed
  const shouldTrack = hasAskedPermission && isTrackingAllowed;

  console.log('🔍 LocationTrackingProvider - shouldTrack:', shouldTrack, {
    hasAskedPermission,
    isTrackingAllowed,
    needsUserDecision,
    permissionState
  });

  const locationTracking = useLocationTracking(radius, shouldTrack, map || undefined);

  return (
    <LocationTrackingContext.Provider
      value={{
        ...locationTracking,

        // Permission state
        hasAskedPermission,
        isTrackingAllowed,
        needsUserDecision,
        permissionState,
        isPermissionLoading,

        // Permission actions
        allowLocation,
        denyLocation,
        toggleTracking,
        resetPermission
      }}
    >
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