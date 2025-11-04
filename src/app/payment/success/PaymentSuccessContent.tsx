'use client';

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useStripe } from '@stripe/react-stripe-js';
import { userAlertStore, SERVERIFY_ALERT } from '@/features/alert/stores/alert.store';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function PaymentSuccessContent() {
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
      const clientSecret = searchParams?.get('payment_intent_client_secret');
      const setupIntent = searchParams?.get('setup_intent');
      const paymentIntent = searchParams?.get('payment_intent');

      if (!clientSecret && !setupIntent && !paymentIntent) {
        router.push('/');
        return;
      }

      try {
        if (clientSecret) {
          // Retrieve the PaymentIntent
          const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);
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
        } else if (setupIntent) {
          // Handle SetupIntent (card saving)
          const { setupIntent: si } = await stripe.retrieveSetupIntent(setupIntent);
          if (!si) {
            throw new Error('Setup intent not found');
          }

          if (si.status === 'succeeded') {
            addAlert({
              severity: SERVERIFY_ALERT.SUCCESS,
              message: 'Card saved successfully!',
            });
            setTimeout(() => {
              router.push('/workspace/discovery');
            }, 2000);
          } else {
            addAlert({
              severity: SERVERIFY_ALERT.ERROR,
              message: 'Failed to save card. Please try again.',
            });
            setTimeout(() => {
              router.push('/workspace/discovery');
            }, 2000);
          }
        } else if (paymentIntent) {
          // Handle paymentIntent parameter
          const { paymentIntent: pi } = await stripe.retrievePaymentIntent(paymentIntent);
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
        Processing your payment...
      </Typography>
      <CircularProgress size={24} />
    </Box>
  );
}