import ThemeProviderWrapper from '@/components/ThemeProviderWrapper';
import EmotionRegistry from '@/components/EmotionRegistry';
import { Metadata } from 'next';
import '@fortawesome/fontawesome-free/css/all.min.css';

export const metadata: Metadata = {
  title: 'Cella',
  description: 'Discovery Workspace',
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
      </body>
    </html>
  );
}
