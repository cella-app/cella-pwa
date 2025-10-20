/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useState } from 'react';
import { loadStripe, StripeElementChangeEvent, StripeElementsOptions, StripeError } from '@stripe/stripe-js';
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { paymentApi } from '@/shared/api/payment.api';
import { rootStyle } from '@/theme';
import { useRouter, useSearchParams } from 'next/navigation';
import { userAlertStore, SERVERIFY_ALERT } from '@/features/alert/stores/alert.store';

// MUI Components
import {
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
} from '@mui/material';

import { STRIPE_PUBLIC_KEY_APP } from '@/shared/config/env';
import CheckoutPage from './CheckoutPage';

// --- Stripe Promise ---
const stripePromise = loadStripe(STRIPE_PUBLIC_KEY_APP);

const defaultOptions: StripeElementsOptions = {
  mode: 'setup',
  currency: 'eur',
  paymentMethodTypes: ['card', 'link'],
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

const stripeElementOptions = {
  style: {
    base: {
      fontFamily: rootStyle.mainFontFamily,
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      fontWeight: '700',
      '::placeholder': {
        color: "#0000004D",
      },
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a',
    },
  },
};

const commonBoxInputStyle = {
  height: "46.6px",
};

// --- Main Component Logic ---
function AddCardInner({ onSkip }: { onSkip?: () => void }) {
  const searchParams = useSearchParams();
  const from = searchParams?.get('frm') || '/workspace/discovery';
  const router = useRouter();
  
  const stripe = useStripe();
  const elements = useElements();
  const { addAlert } = userAlertStore();

  const [nameOnCard, setNameOnCard] = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elementErrors, setElementErrors] = useState({
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
  });
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // Fetch SetupIntent client secret on component mount for digital wallets
  React.useEffect(() => {
    console.log("MOunting");
    
    async function fetchClientSecret() {
      try {
        const setupIntent = await paymentApi.getSetupIntent();
        setClientSecret(setupIntent.client_secret);
      } catch (err) {
        console.error("Failed to fetch setup intent:", err);
        setError("Failed to initialize payment. Please try again.");
      }
    }
    fetchClientSecret();
  }, []);

  const handleElementChange =
    (elementName: keyof typeof elementErrors) =>
    (event: StripeElementChangeEvent) => {
      setElementErrors((prev) => ({
        ...prev,
        [elementName]: event.error ? event.error.message : "",
      }));
    };

 /*  const handleDigitalWalletSuccess = () => {
    setSuccess(true);
    addAlert({
      severity: SERVERIFY_ALERT.SUCCESS,
      message: "Payment method added successfully!",
    });
    setTimeout(() => {
      router.push(from);
    }, 2000);
  };

  const handleDigitalWalletError = (errorMessage: string) => {
    addAlert({
      severity: SERVERIFY_ALERT.ERROR,
      message: errorMessage,
    });
    setError(errorMessage);
  }; */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !clientSecret) { // ✅ Added clientSecret check
      setError('Payment not initialized. Please try again.');
      return;
    }

    setProcessing(true);
    setError(null);
    setSuccess(false);

    try {
      const cardNumberElement = elements.getElement(CardNumberElement);
      if (!cardNumberElement) throw new Error('Card elements not loaded');

      const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardNumberElement,
        billing_details: { name: nameOnCard },
      });
      if (paymentMethodError) throw paymentMethodError;

      // ✅ FIXED: Use CACHED clientSecret (0.1s vs 1s)
      const { error: setupError, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: paymentMethod.id,
      });

      if (setupError) throw setupError;
      if (setupIntent?.status === 'succeeded') {
        setSuccess(true);
        addAlert({
          severity: SERVERIFY_ALERT.SUCCESS,
          message: "Add card successful!"
        });
        setTimeout(() => router.push(from), 2000);
      } else {
        throw new Error(setupIntent?.status || 'Unexpected error');
      }
    } catch (err) {
      const apiError = err as StripeError | Error;
      addAlert({
        severity: SERVERIFY_ALERT.ERROR,
        message: apiError.message || 'Failed to save card. Please try again.'
      });
      setError(apiError.message || 'Failed to save card. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Box>
      <Box component="form" onSubmit={handleSubmit}>
        <CheckoutPage />

        <Box sx={{
          border: "1px solid",
          borderColor: rootStyle.borderColorMain,
          borderRadius: `${rootStyle.borderRadius.md}px`,
          mb: 3,
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
        }}>
          {/* Card Number Field */}
          <Box
            sx={{
              borderBottom: "1px solid",
              borderColor: rootStyle.borderColorMain,
              flex: 1,
              px: 2,
              py: 1.5,
              ...commonBoxInputStyle
            }}
          >
            <CardNumberElement
              options={{
                ...stripeElementOptions,
                placeholder: 'Card Number',
              }}
              onChange={handleElementChange('cardNumber')}
            />
          </Box>

          {/* Expiry and CVC Row */}
          <Box sx={{ display: 'flex' }}>
            {/* Expiry Date */}
            <Box
              sx={{
                flex: 6,
                px: 2,
                py: 1.5,
                ...commonBoxInputStyle
              }}
            >
              <CardExpiryElement
                options={{
                  ...stripeElementOptions,
                  placeholder: 'MM/YY',
                }}
                onChange={handleElementChange('cardExpiry')}
              />
            </Box>

            <Box
              sx={{
                flex: 4,
                borderLeft: '1px solid',
                borderColor: rootStyle.borderColorMain,
                ...commonBoxInputStyle,
                px: 2,
                py: 1.5,
              }}
            >
              <CardCvcElement
                options={{
                  ...stripeElementOptions,
                  placeholder: 'CVC',
                }}
                onChange={handleElementChange('cardCvc')}
              />
            </Box>
          </Box>

          {/* Name on Card */}
          <Box
            sx={{
              borderTop: "1px solid",
              borderColor: rootStyle.borderColorMain,
              px: 2,
              py: 0.5,
              ...commonBoxInputStyle,
            }}
          >
            <TextField
              fullWidth
              placeholder="Name on Card"
              variant="standard"
              value={nameOnCard}
              onChange={(e) => setNameOnCard(e.target.value)}
              InputProps={{
                disableUnderline: true,
                sx: {
                  ...stripeElementOptions.style.base,
                  '& input': {
                    padding: '8px 0',
                  },
                },
              }}
            />
          </Box>
          {elementErrors.cardNumber && (
            <Typography variant="caption" color="error" sx={{ display: 'block' }}>
              {elementErrors.cardNumber}
            </Typography>
          )}
          {elementErrors.cardCvc && (
            <Typography variant="caption" color="error" sx={{ display: 'block' }}>
              {elementErrors.cardCvc}
            </Typography>
          )}
          {elementErrors.cardExpiry && (
            <Typography variant="caption" color="error" sx={{ display: 'block' }}>
              {elementErrors.cardExpiry}
            </Typography>
          )}
        </Box>
        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={processing || success || !stripe || !elements}
        >
          {processing ? <CircularProgress size={24} color="inherit" /> : 'Save Card'}
        </Button>
      </Box>
      <Button
        variant="text"
        onClick={() => onSkip?.()}
        disabled={processing}
        sx={{
          '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' }
        }}
      >
        Skip for now
      </Button>
    </Box>
  );
}

// --- Wrapper Component ---
export default function AddCardFormMui({ onSkip, }: { onSkip?: () => void }) {
  return (
    <Elements stripe={stripePromise} options={defaultOptions}>
      <AddCardInner onSkip={onSkip} />
    </Elements>
  );
}