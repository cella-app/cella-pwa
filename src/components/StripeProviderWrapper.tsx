'use client';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import { STRIPE_PUBLIC_KEY_APP } from '@/shared/config/env';
import { ReactNode } from 'react';

// Make sure to call loadStripe outside of a component's render to avoid
// recreating the Stripe object on every render.
const stripePromise = loadStripe(STRIPE_PUBLIC_KEY_APP);

const defaultOptions: StripeElementsOptions = {
  mode: 'setup',
  currency: 'eur',
  appearance: {
    theme: 'stripe',
    variables: {
      colorPrimary: '#0570de',
      colorBackground: '#ffffff',
      colorText: '#30313d',
      colorDanger: '#df1b41',
      fontFamily: 'system-ui, sans-serif',
      spacingUnit: '6px',
      borderRadius: '4px',
    },
  },
};

interface StripeProviderWrapperProps {
  children: ReactNode;
  options?: StripeElementsOptions;
}

export default function StripeProviderWrapper({
  children,
  options = defaultOptions,
}: StripeProviderWrapperProps) {
    
  if (!stripePromise) {
    console.error('Stripe failed to initialize');
    return null;
  }
    
  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
}