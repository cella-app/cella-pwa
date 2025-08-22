import ThemeProviderWrapper from '@/components/ThemeProviderWrapper';
import EmotionRegistry from '@/components/EmotionRegistry';
import { Metadata } from 'next';
import '@fortawesome/fontawesome-free/css/all.min.css';
import AddToHomeScreenButton from '@/components/AddToHomeScreenButton';

export const metadata: Metadata = {
  title: 'Cella',
  description: 'Discovery Workspace',
  manifest: '/manifest.json',
  themeColor: '#000000',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  icons: {
    icon: [
      { url: '/pwa/main-logo.png', sizes: '72x72', type: 'image/png' },
      { url: '/pwa/main-logo.png', sizes: '96x96', type: 'image/png' },
      { url: '/pwa/main-logo.png', sizes: '128x128', type: 'image/png' },
      { url: '/pwa/main-logo.png', sizes: '144x144', type: 'image/png' },
      { url: '/pwa/main-logo.png', sizes: '152x152', type: 'image/png' },
      { url: '/pwa/main-logo.png', sizes: '192x192', type: 'image/png' },
      { url: '/pwa/main-logo.png', sizes: '180x180', type: 'image/png' },
      { url: '/pwa/main-logo.png', sizes: '384x384', type: 'image/png' },
      { url: '/pwa/iconL.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/pwa/main-logo.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
              <EmotionRegistry>
                <ThemeProviderWrapper>
                  {children}
                </ThemeProviderWrapper>
              </EmotionRegistry>
              <AddToHomeScreenButton />
      </body>
    </html>
  );
}
