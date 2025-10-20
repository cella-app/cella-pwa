'use client';

import React, { Suspense } from 'react';
import PaymentSuccessContent from './PaymentSuccessContent';
import { Box, CircularProgress } from '@mui/material';

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
          }}
        >
          <CircularProgress />
        </Box>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}