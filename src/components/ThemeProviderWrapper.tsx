'use client';

import { ThemeProvider, CssBaseline } from '@mui/material';
import { CacheProvider } from '@emotion/react';
import createEmotionCache from '@/createEmotionCache';
import theme from '@/theme';
import { useState } from 'react';

export default function ThemeProviderWrapper({ children }: { children: React.ReactNode }) {
  const [emotionCache] = useState(() => createEmotionCache());

  return (
    <CacheProvider value={emotionCache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </CacheProvider>
  );
}
