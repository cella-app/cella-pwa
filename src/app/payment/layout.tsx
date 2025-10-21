'use client';

import { ReactNode } from 'react';
import StripeProviderWrapper from '@/components/StripeProviderWrapper';

export default function PaymentLayout({ children }: { children: ReactNode }) {
  return (
    <StripeProviderWrapper>
      {children}
    </StripeProviderWrapper>
  );
}