'use client';

import { ThemeProvider, CssBaseline, Container } from '@mui/material';
import theme from '@/theme';
import { AlertComponent } from '@/components/AlertComponent';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { userAlertStore } from '@/features/alert/stores/alert.store';

export default function ThemeProviderWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const clearAlerts = userAlertStore((state) => state.clearAlerts);

  useEffect(() => {
    clearAlerts();
  }, [pathname, clearAlerts]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container
        sx={{
          position: 'fixed',
          top: 16,
          left: 0,
          right: 0,
          zIndex: 1301,
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <AlertComponent />
      </Container>
      {children}
    </ThemeProvider>
  );
}
