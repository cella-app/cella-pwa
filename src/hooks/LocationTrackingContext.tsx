'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useLocationTracking } from './useLocationTracking';
import { useMapStore } from '@/features/map/stores/map.store';
import { useRadiusStore } from '@/features/map/stores/radius.store';
import { PodList } from '@/shared/data/models/Pod';
import { LocationData } from '@/shared/data/models/Location';

// Use the same key as MapContent to avoid conflicts
const LOCATION_PERMISSION_KEY = "locationPermissionAsked";

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

  // Fixed: Simplified permission check - don't duplicate MapContent logic
  useEffect(() => {
    console.log("🔍 LocationTrackingProvider - Checking initial tracking state");

    if (typeof window === 'undefined') return;

    const alreadyAsked = localStorage.getItem(LOCATION_PERMISSION_KEY);
    console.log("🔍 LocationTrackingProvider - Already asked:", alreadyAsked);

    // If permission dialog hasn't been shown yet, don't auto-start tracking
    if (alreadyAsked !== 'true') {
      console.log("❌ LocationTrackingProvider - Permission not asked yet, waiting for user dialog");
      return;
    }

    // If permission was already handled, check current state
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        console.log("🔍 LocationTrackingProvider - Permission state:", result.state);

        if (result.state === 'granted') {
          console.log("✅ LocationTrackingProvider - Permission granted, starting tracking");
          setStartTracking(true);
        } else {
          console.log("❌ LocationTrackingProvider - Permission denied/prompt, not starting tracking");
          setStartTracking(false);
        }
      }).catch((error) => {
        console.warn("⚠️ LocationTrackingProvider - Permissions API failed:", error);
        // Don't auto-start tracking if we can't check permissions
        setStartTracking(false);
      });
    } else {
      console.warn("⚠️ LocationTrackingProvider - Permissions API not supported");
      // Fallback: don't auto-start, let user decide via MapContent dialog
      setStartTracking(false);
    }
  }, []);

  // Save tracking preference when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const trackingValue = startTracking.toString();
      localStorage.setItem('startTracking', trackingValue);
      console.log("💾 LocationTrackingProvider - Saved startTracking:", trackingValue);
    }
  }, [startTracking]);

  const locationTracking = useLocationTracking(radius, startTracking, map || undefined);

  // Enhanced setStartTracking to handle permission persistence
  const handleSetStartTracking = (value: boolean) => {
    console.log("🔄 LocationTrackingProvider - setStartTracking called with:", value);
    setStartTracking(value);

    // Mark permission as handled when user makes a choice
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCATION_PERMISSION_KEY, "true");
      console.log("💾 LocationTrackingProvider - Marked permission as asked");
    }
  };

  return (
    <LocationTrackingContext.Provider
      value={{
        ...locationTracking,
        setStartTracking: handleSetStartTracking
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