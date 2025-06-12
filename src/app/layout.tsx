import ThemeProviderWrapper from '@/components/ThemeProviderWrapper';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cella',
  description: 'Created with Next.js',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <ThemeProviderWrapper>{children}</ThemeProviderWrapper>
      </body>
    </html>
  );
}
