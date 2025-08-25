'use client';

import dynamic from 'next/dynamic';
import { Box } from '@mui/material';
import { LocationTrackingProvider } from '@/hooks/LocationTrackingContext';
import { useEffect, useState } from 'react';
import { getUser } from '@/shared/utils/auth';
import { useReservationStore } from '@/features/reservation/stores/reservation.store';
import { useSessionStore } from '@/features/session/stores/session.store';
import { User } from '@/shared/data/models/User';
import { useRouter } from 'next/navigation';

const MapContent = dynamic(() => import('@/features/pods/MapContent'), {
  ssr: false,
  loading: () => <Box><div
    style={{
      height: '100vh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f5f5f5',
    }}
  >
    <div>Loading...</div>
  </div></Box>,
});

const useInitializeUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const initialize = async () => {
      try {
        const fetchedUser = getUser();
        setUser(fetchedUser);
      } catch (error) {
        console.error('Failed to fetch user:', error);
        router.push('/error');
      }
    };
    initialize();
  }, [router]);

  return user;
};

const useInitializeSession = () => {
  const { checkSession, current: currentSession } = useSessionStore();
  const router = useRouter();

  useEffect(() => {
    const initialize = async () => {
      try {
        await checkSession();
      } catch (error) {
        console.error('Session check failed:', error);
        router.push('/error');
      }
    };
    initialize();
  }, [checkSession, router]);

  return { currentSession, router };
};

const useInitializeReservation = () => {
  const { checkReservation } = useReservationStore();

  useEffect(() => {
    const initialize = async () => {
      try {
        await checkReservation();
      } catch (error) {
        console.error('Reservation check failed:', error);
      }
    };
    initialize();
  }, [checkReservation]);
};

export default function MapPage() {
  useInitializeUser();
  const { currentSession, router } = useInitializeSession();
  useInitializeReservation();

  console.log("Current Session", currentSession)
  useEffect(() => {
    if (currentSession?.id) {
      router.push(`/session/${currentSession.id}/progress`);
    }
  }, [currentSession, router]);

  if (process.env.NODE_ENV === 'development') {
    console.log('Current session:', currentSession);
  }

  return (
    <Box sx={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <LocationTrackingProvider>
        <MapContent />
      </LocationTrackingProvider>
    </Box>
  );
}