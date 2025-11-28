import React from 'react';
import CreditCardIcon from "@mui/icons-material/CreditCard";
import AppleIcon from "@mui/icons-material/Apple";
import GoogleIcon from "@mui/icons-material/Google";
import { rootStyle } from '@/theme';
import { PaymentMethod } from '@/shared/data/models/Payment';

export const getPaymentMethodLabel = (pm: PaymentMethod): string => {
  const walletType = pm.detail?.wallet?.type;
  const isGooglePayCard = pm.type === 'card' && walletType === 'google_pay';
  const isApplePayCard = pm.type === 'card' && walletType === 'apple_pay';

  if (isGooglePayCard) {
    return `Google Pay (${pm.brand ? pm.brand.charAt(0).toUpperCase() + pm.brand.slice(1) : 'Visa'} •••• ${pm.last4})`;
  }
  if (isApplePayCard) {
    return `Apple Pay (${pm.brand ? pm.brand.charAt(0).toUpperCase() + pm.brand.slice(1) : 'Visa'} •••• ${pm.last4})`;
  }
  if (pm.type === 'apple_pay') return 'Apple Pay';
  if (pm.type === 'google_pay') return 'Google Pay';
  return `${pm.brand ? pm.brand.charAt(0).toUpperCase() + pm.brand.slice(1) : 'Card'} •••• ${pm.last4}`;
};

export const getPaymentMethodIcon = (pm: PaymentMethod, size: number = 28) => {
  const walletType = pm.detail?.wallet?.type;
  const isGooglePayCard = pm.type === 'card' && walletType === 'google_pay';
  const isApplePayCard = pm.type === 'card' && walletType === 'apple_pay';
  const iconProps = { fontSize: size, mr: size > 20 ? 2 : 1 };

  if (isGooglePayCard) return <GoogleIcon sx={{ ...iconProps, color: '#4285F4' }} />;
  if (isApplePayCard) return <AppleIcon sx={{ ...iconProps, color: rootStyle.textColor }} />;
  if (pm.type === 'apple_pay') return <AppleIcon sx={{ ...iconProps, color: rootStyle.textColor }} />;
  if (pm.type === 'google_pay') return <GoogleIcon sx={{ ...iconProps, color: '#4285F4' }} />;
  return <CreditCardIcon sx={{ ...iconProps, color: rootStyle.elementColor }} />;
};

