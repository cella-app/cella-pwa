'use client';

export const dynamic = 'force-dynamic';

import React, { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useStripe } from '@stripe/react-stripe-js';
import { userAlertStore, SERVERIFY_ALERT } from '@/features/alert/stores/alert.store';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

function PaymentSuccessContent() {
  const stripe = useStripe();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addAlert } = userAlertStore();

  useEffect(() => {
    async function verifyPayment() {
      if (!stripe) {
        console.log('Stripe not initialized');
        return;
      }

      // Retrieve the client secrets
      const paymentIntentClientSecret = searchParams?.get('payment_intent_client_secret');
      const setupIntentClientSecret = searchParams?.get('setup_intent_client_secret');
      const paymentIntentId = searchParams?.get('payment_intent');

      if (!paymentIntentClientSecret && !setupIntentClientSecret && !paymentIntentId) {
        router.push('/workspace/discovery');
        return;
      }

      try {
        if (setupIntentClientSecret) {
          // Handle SetupIntent (card saving) - prioritize this since it's most common
          const { setupIntent: si } = await stripe.retrieveSetupIntent(setupIntentClientSecret);
          if (!si) {
            throw new Error('Setup intent not found');
          }

          if (si.status === 'succeeded') {
            addAlert({
              severity: SERVERIFY_ALERT.SUCCESS,
              message: 'Card saved successfully!',
            });

            router.push('/workspace/discovery');

          } else {
            addAlert({
              severity: SERVERIFY_ALERT.ERROR,
              message: 'Failed to save card. Please try again.',
            });
          }

          router.push('/payment/add-to-card?frm=/profile');

        } else if (paymentIntentClientSecret) {
          // Retrieve the PaymentIntent
          const { paymentIntent } = await stripe.retrievePaymentIntent(paymentIntentClientSecret);
          if (!paymentIntent) {
            throw new Error('Payment intent not found');
          }

          switch (paymentIntent.status) {
            case 'succeeded':
              addAlert({
                severity: SERVERIFY_ALERT.SUCCESS,
                message: 'Payment successful!',
              });
              setTimeout(() => {
                router.push('/workspace/discovery');
              }, 2000);
              break;
            case 'processing':
              addAlert({
                severity: SERVERIFY_ALERT.INFO,
                message: 'Payment is still processing.',
              });
              setTimeout(() => {
                router.push('/workspace/discovery');
              }, 3000);
              break;
            case 'requires_payment_method':
              addAlert({
                severity: SERVERIFY_ALERT.ERROR,
                message: 'Payment failed. Please try another payment method.',
              });
              setTimeout(() => {
                router.push('/workspace/discovery');
              }, 2000);
              break;
            default:
              addAlert({
                severity: SERVERIFY_ALERT.ERROR,
                message: 'Something went wrong.',
              });
              setTimeout(() => {
                router.push('/workspace/discovery');
              }, 2000);
              break;
          }
        } else if (paymentIntentId) {
          // Handle paymentIntent ID parameter
          const { paymentIntent: pi } = await stripe.retrievePaymentIntent(paymentIntentId);
          if (!pi) {
            throw new Error('Payment intent not found');
          }

          if (pi.status === 'succeeded') {
            addAlert({
              severity: SERVERIFY_ALERT.SUCCESS,
              message: 'Payment successful!',
            });
            setTimeout(() => {
              router.push('/workspace/discovery');
            }, 2000);
          } else {
            addAlert({
              severity: SERVERIFY_ALERT.ERROR,
              message: 'Payment failed. Please try again.',
            });
            setTimeout(() => {
              router.push('/workspace/discovery');
            }, 2000);
          }
        }
      } catch (err) {
        console.error('Error:', err);
        addAlert({
          severity: SERVERIFY_ALERT.ERROR,
          message: 'An error occurred while checking payment status.',
        });
        setTimeout(() => {
          router.push('/workspace/discovery');
        }, 2000);
      }
    }

    verifyPayment();
  }, [stripe, searchParams, router, addAlert]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 2,
        p: 3,
      }}
    >
      <CheckCircleIcon color="success" sx={{ fontSize: 64 }} />
      <Typography variant="h5" align="center">
        Confirming status...
      </Typography>
      <CircularProgress size={24} />
    </Box>
  );
}

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