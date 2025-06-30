/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import dynamic from 'next/dynamic';
import { Box } from '@mui/material';
import { LocationTrackingProvider } from '@/hooks/LocationTrackingContext';
import { useEffect, useState } from "react";
import { getUser } from "@/shared/utils/auth";
import { useReservationStore } from '@/features/reservation/stores/reservation.store';
import { useSessionStore } from '@/features/reservation/stores/session.store';
import { User } from '@/shared/data/models/User';
import { useRouter } from 'next/navigation';

const MapContent = dynamic(() => import('@/features/pods/MapContent'), { ssr: false });

export default function MapPage() {
  const [user, setUser] = useState<User | null>(null);

  const { checkReservation } = useReservationStore();
  const { checkSession, current: currentSession } = useSessionStore();
  const router = useRouter();

  useEffect(() => {
    setUser(getUser());

    checkReservation();
    checkSession();
  }, []);

  return (
    <Box sx={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <LocationTrackingProvider radius={1000}>
        <MapContent />
      </LocationTrackingProvider>
    </Box>
  );
}
