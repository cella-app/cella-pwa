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
import { getSafeViewportHeight } from '@/shared/utils/positioning';

const MapContent = dynamic(() => import('@/features/pods/MapContent'), {
  ssr: false,
  loading: () => {
    const loadingHeight = typeof window !== 'undefined' ? getSafeViewportHeight() : 600;
    return (
      <Box>
        <div
          style={{
            height: `${loadingHeight}px`, // Use safe height
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f5f5f5',
          }}
        >
          <div>Loading...</div>
        </div>
      </Box>
    );
  },
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

const useSafeViewportHeight = () => {
  const [height, setHeight] = useState<number>(600); // Fallback

  useEffect(() => {
    const updateHeight = () => {
      const safeHeight = getSafeViewportHeight();
      setHeight(safeHeight);
    };

    updateHeight();
    
    // Update on window resize and orientation change
    window.addEventListener('resize', updateHeight);
    window.addEventListener('orientationchange', updateHeight);

    return () => {
      window.removeEventListener('resize', updateHeight);
      window.removeEventListener('orientationchange', updateHeight);
    };
  }, []);

  return height;
};

export default function MapPage() {
  useInitializeUser();
  const { currentSession, router } = useInitializeSession();
  useInitializeReservation();
  const safeHeight = useSafeViewportHeight();

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
    <Box sx={{ 
      width: '100vw', 
      height: `${safeHeight}px`, // Use safe height instead of 100vh
      position: 'relative',
      overflow: 'hidden' // Prevent scroll bars
    }}>
      <LocationTrackingProvider>
        <MapContent />
      </LocationTrackingProvider>
    </Box>
  );
}