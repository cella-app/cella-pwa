export const ENV = {
  API_URL: process.env.NEXT_PUBLIC_API_URL,
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_TEST: process.env.NODE_ENV === 'test'
} as const;

export const DEFAULT_CENTER: [number, number] = [
  parseFloat(process.env.NEXT_PUBLIC_MAP_CENTER_LAT || '52.52'),
  parseFloat(process.env.NEXT_PUBLIC_MAP_CENTER_LNG || '13.405')
];

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Cella';

export const STRIPE_PUBLIC_KEY_APP = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY_APP || "";

