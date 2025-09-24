'use client';

import { Box } from '@mui/material';

export default function MapLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ width: '100vw', height: '100%', bgcolor: '#f5f5f5', position: 'absolute !important' }} className="layout-map-page-container">
      {children}
    </Box>
  );
} 