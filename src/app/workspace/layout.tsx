'use client';

import { Box } from '@mui/material';

export default function MapLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ width: '100vw', height: '100vh', bgcolor: '#f5f5f5', position: 'relative' }} className="map-page-container">
      {children}
    </Box>
  );
} 