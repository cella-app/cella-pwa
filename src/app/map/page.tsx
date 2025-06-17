'use client';

import dynamic from 'next/dynamic';
import { Box } from '@mui/material';

const MapContent = dynamic(() => import('@/components/MapContent'), { ssr: false });

export default function MapPage() {
  return (
    <Box sx={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <MapContent />
    </Box>
  );
} 