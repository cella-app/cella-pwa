'use client';

import dynamic from 'next/dynamic';
import { Box } from '@mui/material';
import { LocationTrackingProvider } from '@/hooks/LocationTrackingContext';

const MapContent = dynamic(() => import('@/components/MapContent'), { ssr: false });

export default function MapPage() {
  return (
    <Box sx={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <LocationTrackingProvider radius={1000}>
        <MapContent />
      </LocationTrackingProvider>
    </Box>
  );
} 