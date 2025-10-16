"use client";

import React, { useEffect, useState } from "react";
import {
  PaymentRequest,
  PaymentRequestPaymentMethodEvent,
} from "@stripe/stripe-js";
import {
  PaymentRequestButtonElement,
  useStripe,
} from "@stripe/react-stripe-js";
import { Box, Typography } from "@mui/material";
import { rootStyle } from "@/theme";

interface DigitalWalletButtonProps {
  onSuccess: () => void;
  onError: (error: string) => void;
  clientSecret: string;
}

export default function DigitalWalletButton({
  onSuccess,
  onError,
  clientSecret,
}: DigitalWalletButtonProps) {
  const stripe = useStripe();
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(
    null
  );
  const [canMakePayment, setCanMakePayment] = useState(false);

  useEffect(() => {
    if (!stripe || !clientSecret) return;

    // Create payment request for Apple Pay / Google Pay
    const pr = stripe.paymentRequest({
      country: "US",
      currency: "usd",
      total: {
        label: "Add Payment Method",
        amount: 0, // SetupIntent doesn't charge, so amount is 0
      },
      requestPayerName: true,
      requestPayerEmail: false,
    });

    let mounted = true;

    // Async check for wallet availability with error handling
    (async () => {
      try {
        const result = await pr.canMakePayment();
        console.log("Digital wallet availability:", result);
        if (!mounted) return;
        if (result) {
          setPaymentRequest(pr);
          setCanMakePayment(true);
        } else {
          console.log(
            "Digital wallets (Apple Pay/Google Pay) are not available on this browser/device"
          );
        }
      } catch (err) {
        console.warn("canMakePayment error:", err);
      }
    })();

    // Handle payment method event
    const handlePaymentMethod = async (
      ev: PaymentRequestPaymentMethodEvent
    ) => {
      try {
        // Confirm the SetupIntent with the payment method from Apple Pay/Google Pay
        const { error: confirmError, setupIntent } =
          await stripe.confirmCardSetup(clientSecret, {
            payment_method: ev.paymentMethod.id,
          });

        if (confirmError) {
          ev.complete("fail");
          onError(confirmError.message || "Payment failed");
          return;
        }

        if (setupIntent?.status === "succeeded") {
          ev.complete("success");
          onSuccess();
        } else {
          ev.complete("fail");
          onError(setupIntent?.status || "Payment failed");
        }
      } catch (err) {
        ev.complete("fail");
        onError((err as Error).message || "Payment failed");
      }
    };

    pr.on("paymentmethod", handlePaymentMethod);
  }, [stripe, clientSecret, onSuccess, onError]);

  if (!canMakePayment || !paymentRequest) {
    return null;
  }

  return (
    <Box>
      <PaymentRequestButtonElement
        options={{
          paymentRequest,
          style: {
            paymentRequestButton: {
              type: "default",
              theme: "dark",
              height: "48px",
            },
          },
        }}
      />
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          my: 3,
          gap: 2,
        }}
      >
        <Box
          sx={{ flex: 1, height: "1px", bgcolor: rootStyle.borderColorMain }}
        />
        <Typography
          sx={{
            fontFamily: rootStyle.mainFontFamily,
            fontSize: "14px",
            fontWeight: 600,
            color: rootStyle.descriptionColor,
          }}
        >
          or pay with card
        </Typography>
        <Box
          sx={{ flex: 1, height: "1px", bgcolor: rootStyle.borderColorMain }}
        />
      </Box>
    </Box>
  );
}
