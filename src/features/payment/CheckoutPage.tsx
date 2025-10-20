'use client';

import React, { useState } from 'react';
import { useStripe, useElements, ExpressCheckoutElement } from '@stripe/react-stripe-js';
import { Box, Typography } from '@mui/material';
import { userAlertStore, SERVERIFY_ALERT } from '@/features/alert/stores/alert.store';
import { paymentApi } from '@/shared/api/payment.api';

const CheckoutPage = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { addAlert } = userAlertStore();
  const [errorMessage, setErrorMessage] = useState<string>();

  const onConfirm = async () => {
    if (!stripe || !elements) {
      return;
    }

    try {
      // First submit the form
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setErrorMessage(submitError.message);
        return;
      }

      // Create PaymentIntent on the server
      const { client_secret: clientSecret } = await paymentApi.getSetupIntent();

      // Confirm the PaymentIntent
      const { error } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success`,
        },
      });

      if (error) {
        addAlert({
          severity: SERVERIFY_ALERT.ERROR,
          message: error.message || 'An error occurred during payment.',
        });
        setErrorMessage(error.message);
      } else {
        addAlert({
          severity: SERVERIFY_ALERT.SUCCESS,
          message: 'Payment successful!',
        });
        // Payment successful - the UI will automatically close with success animation
        // and customer will be redirected to return_url
      }
    } catch (err) {
      console.error('Payment error:', err);
      addAlert({
        severity: SERVERIFY_ALERT.ERROR,
        message: 'An unexpected error occurred.',
      });
      setErrorMessage('An unexpected error occurred.');
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 500, mx: 'auto', p: 2 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Complete Payment
      </Typography>
      
      <ExpressCheckoutElement 
        onConfirm={onConfirm}
      />

      {errorMessage && (
        <Typography color="error" sx={{ mt: 2 }}>
          {errorMessage}
        </Typography>
      )}
    </Box>
  );
};

export default CheckoutPage