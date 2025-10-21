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
  country?: string;
  currency?: string;
  label?: string;
}

export default function DigitalWalletButton({
  onSuccess,
  onError,
  clientSecret,
  country = "US",
  currency = "usd",
  label = "Complete Setup",
}: DigitalWalletButtonProps) {
  const stripe = useStripe();

  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(
    null
  );
  const [canMakePayment, setCanMakePayment] = useState(false);

  useEffect(() => {
    if (!stripe || !clientSecret) return;

    const pr = stripe.paymentRequest({
      country,
      currency,
      total: { label, amount: 100 }, // ✅ FIXED: Must be > 0**
      requestPayerName: true,
      requestPayerEmail: false,
    });

    let mounted = true;

    (async () => {
      try {
        const result = await pr.canMakePayment();
        console.log("✅ Wallet check:", result);
        if (!mounted) return;

        if (result) {
          setPaymentRequest(pr);
          setCanMakePayment(true);
          console.log("✅ Buttons will show!");
        } else {
          console.log("❌ No wallet support");
        }
      } catch (err) {
        console.error("❌ Wallet error:", err);
      }
    })();

    const handlePaymentMethod = async (
      ev: PaymentRequestPaymentMethodEvent
    ) => {
      try {
        const { error: confirmError } =
          await stripe.confirmCardSetup(clientSecret, {
            payment_method: ev.paymentMethod.id,
          });

        if (confirmError) {
          ev.complete("fail");
          onError(confirmError.message || "Setup failed");
          return;
        }

        ev.complete("success");
        onSuccess();
      } catch (err) {
        ev.complete("fail");
        onError((err as Error).message || "Setup failed");
      }
    };

    pr.on("paymentmethod", handlePaymentMethod);

    return () => {
      mounted = false;
    };
  }, [stripe, clientSecret, country, currency, label, onSuccess, onError]);

  // ✅ DEBUG: Show status**
  console.log("Render:", { canMakePayment, hasPR: !!paymentRequest });

  if (!canMakePayment || !paymentRequest) {
    return (
      <Box>
        <Typography variant="body2" color="textSecondary">
          **Digital wallets not available**
        </Typography>
      </Box>
    ); // ✅ Show why it's hidden
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
      {/* Your existing divider */}
      <Box sx={{ display: "flex", alignItems: "center", my: 3, gap: 2 }}>
        <Box
          sx={{ flex: 1, height: "1px", bgcolor: rootStyle.borderColorMain }}
        />
        <Typography
          sx={{
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
