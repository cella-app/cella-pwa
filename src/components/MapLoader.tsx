'use client';

import { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import { useLoadingStore } from '@/features/map/stores/loading.store';
import { useMapStore } from '@/features/map/stores/map.store';
import { CircularProgress, Box } from '@mui/material';
import { rootStyle } from '@/theme';
import { useEventStore } from '@/features/map/stores/event.store';

const MapLoader = () => {
  const map = useMap();
  const { loading } = useLoadingStore();
  const { showLoader } = useEventStore();
  const { currentMapCenter } = useMapStore();
  const [position, setPosition] = useState({ x: 0, y: 0 });

  console.warn("check show", loading, showLoader)
  // Update loader position based on map center
  useEffect(() => {
    if (!map || !loading || !showLoader) return;

    const updatePosition = () => {
      
      // Get center coordinates
      const centerLatLng = currentMapCenter 
        ? { lat: currentMapCenter.latitude, lng: currentMapCenter.longitude }
        : map.getCenter();
      
      // Convert lat/lng to pixel coordinates
      const centerPoint = map.latLngToContainerPoint(centerLatLng);
      
      setPosition({
        x: centerPoint.x,
        y: centerPoint.y
      });
    };

    updatePosition();

    // Update position when map moves or zooms
    map.on('move', updatePosition);
    map.on('zoom', updatePosition);

    return () => {
      map.off('move', updatePosition);
      map.off('zoom', updatePosition);
    };
  }, [map, loading, currentMapCenter, showLoader]);

  if (!loading || !showLoader) return null;

  return (
    <>
      {/* Blur overlay */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
          backdropFilter: 'blur(2px)',
          zIndex: 1000,
          pointerEvents: 'none',
        }}
      />
      
      {/* Spinner at map center */}
      <Box
        sx={{
          position: 'absolute',
          left: position.x,
          top: position.y,
          transform: 'translate(-50%, -50%)',
          zIndex: 1001,
          pointerEvents: 'none',
        }}
      >
        <CircularProgress 
          size={40} 
          thickness={4}
          sx={{ 
            color: rootStyle.elementColor,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
          }} 
        />
      </Box>
    </>
  );
};

export default MapLoader;