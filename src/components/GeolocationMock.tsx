'use client';

import { useEffect } from 'react';

/**
 * Mock geolocation for development/testing purposes
 * This component overrides navigator.geolocation to return a fixed location
 */
export default function GeolocationMock() {
  useEffect(() => {
   /*  // Only run in browser and development mode
    if (process.env.NODE_ENV !== 'development') {
      return;
    } */

    console.log('🗺️ Geolocation Mock: Initializing with Sydney coordinates');

    // Store original geolocation API
    const originalGeolocation = navigator.geolocation;

    // Mock position for Sydney, Australia
    const mockPosition: GeolocationPosition = {
      coords: {
        latitude: 52.4704,
        longitude: 13.4606,
        /* latitude: -33.8688,
        longitude: 151.2093, */
        accuracy: 10, // Good accuracy to pass the MAX_GPS_ACCURACY filter
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
        toJSON: () => ({}),
      },
      timestamp: Date.now(),
      toJSON: () => ({}),
    };

    let watchId = 0;
    const watchers = new Map<number, PositionCallback>();

    // Create mock geolocation object
    const mockGeolocation: Geolocation = {
      getCurrentPosition: (success: PositionCallback) => {
        console.log('🗺️ Geolocation Mock: getCurrentPosition called');
        // Simulate async behavior
        setTimeout(() => {
          success({
            ...mockPosition,
            timestamp: Date.now(),
          });
        }, 100);
      },

      watchPosition: (success: PositionCallback) => {
        watchId++;
        const currentWatchId = watchId;
        watchers.set(currentWatchId, success);

        console.log(`🗺️ Geolocation Mock: watchPosition called (ID: ${currentWatchId})`);

        // Immediately call success callback with mock position
        setTimeout(() => {
          success({
            ...mockPosition,
            timestamp: Date.now(),
          });
        }, 100);

        // Optionally update position periodically to simulate movement
        // Uncomment if you want to test location updates
        /*
        const interval = setInterval(() => {
          const callback = watchers.get(currentWatchId);
          if (callback) {
            callback({
              ...mockPosition,
              timestamp: Date.now(),
            });
          }
        }, 5000);
        */

        return currentWatchId;
      },

      clearWatch: (id: number) => {
        console.log(`🗺️ Geolocation Mock: clearWatch called (ID: ${id})`);
        watchers.delete(id);
      },
    };

    // Override navigator.geolocation using Object.defineProperty
    Object.defineProperty(navigator, 'geolocation', {
      value: mockGeolocation,
      writable: true,
      configurable: true,
    });

    console.log('🗺️ Geolocation Mock: Active - Location set to Berlin (52.5200, 13.4050)');

    // Cleanup on unmount
    return () => {
      Object.defineProperty(navigator, 'geolocation', {
        value: originalGeolocation,
        writable: true,
        configurable: true,
      });
      console.log('🗺️ Geolocation Mock: Restored original geolocation API');
    };
  }, []);

  // This component doesn't render anything
  return null;
}
