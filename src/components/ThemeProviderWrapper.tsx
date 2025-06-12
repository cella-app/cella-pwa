'use client';

import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import { CacheProvider } from '@emotion/react';
import { AlertComponent } from './AlertComponent';

import createEmotionCache from '@/createEmotionCache';
import theme from '@/theme';

const clientSideEmotionCache = createEmotionCache();

export default function ThemeProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <CacheProvider value={clientSideEmotionCache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{
          zIndex: 100,
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: "10px 10px",
          position: 'relative'
        }}>
          <AlertComponent sx={{ position: 'absolute', top: '10px',}} />
        </Box>
        <Box sx={{
          zIndex: 99
        }}>
          {children}
        </Box>
      </ThemeProvider>
    </CacheProvider>
  );
}
