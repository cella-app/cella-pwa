"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import SessionClock from '@/features/session/SessionClock';
import { Box, CircularProgress, Typography } from "@mui/material";
import { rootStyle } from "@/theme";
import { sessionApi } from '@/shared/api/session.api';
import { Session, SessionStatusEnum } from '@/shared/data/models/Session';

export default function SessionProgressPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.sessionId as string;

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSession() {
      setLoading(true);
      try {
        const session = await sessionApi.getSessionById(sessionId);
        if (!session) {
          router.replace('/not-found');
        } else if (session.status == SessionStatusEnum.ENDED) {
          router.replace(`/session/${session.id}/checkout`);
        } else {
          setSession(session);
        }
      } catch {
        router.replace('/');
      } finally {
        setLoading(false);
      }
    }
    if (sessionId) fetchSession();
  }, [sessionId, router]);

  if (loading) return (
    <Box sx={{
      height: '100vh',
      backgroundColor: rootStyle.backgroundColor,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column',
      py: 4,
      border: "none",
    }}>
      <CircularProgress sx={{ color: rootStyle.elementColor, mb: 3 }} />
      <Typography sx={{ fontFamily: rootStyle.mainFontFamily, fontWeight: 700, fontSize: 24, color: rootStyle.textColor }}>
        Loading...
      </Typography>
    </Box>
  );

  if (!session) return null;

  return (
    <Box sx={{
      height: '100vh',
      backgroundColor: rootStyle.backgroundColor,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      py: 4,
      border: "none",
    }}>
      <SessionClock session={session} />
    </Box>
  );
}
