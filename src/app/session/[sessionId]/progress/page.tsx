"use client";

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import SessionClock from '@/features/reservation/SessionClock';
import {
  Box,
} from "@mui/material";
import { rootStyle } from "@/theme";
import { useSessionStore } from '@/features/reservation/stores/session.store';

export default function SessionProgressPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const { current: currentSession, checkSession } = useSessionStore();

  useEffect(() => {
    checkSession(); // đảm bảo dữ liệu luôn mới
  }, []);

  useEffect(() => {
    if (!currentSession) return;

    if (currentSession.id !== sessionId) {
      router.replace('/not-found'); // hoặc router.push('/')
    }
  }, [currentSession, sessionId, router]);

  if (!currentSession || currentSession.id !== sessionId) {
    return null;
  }

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
      <SessionClock session={currentSession} />
    </Box>
  );
}
