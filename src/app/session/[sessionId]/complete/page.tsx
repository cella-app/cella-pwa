/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  TextField,
  IconButton,
} from "@mui/material";
import { rootStyle } from "@/theme";
import { useSessionStore } from '@/features/reservation/stores/session.store';
import { Session } from '@/shared/data/models/Session';
import { sessionApi } from '@/shared/api/session.api';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockIcon from '@mui/icons-material/Lock';
import EuroIcon from '@mui/icons-material/Euro';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import EditIcon from '@mui/icons-material/Edit';
import StarIcon from '@mui/icons-material/Star';

export default function SessionCompletePage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const { current: currentSession, checkSession, clearSession } = useSessionStore();

  const [sessionDetails, setSessionDetails] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fake data for demo
  const paymentMethod = {
    type: 'Visa',
    last4: '4224',
  };


  const [focusTime, setFocusTime] = useState('57:42');
  const [status, setStatus] = useState('Locked');
  const [totalCost, setTotalCost] = useState('€ 13,11');
  const [rating, setRating] = useState(0);
  const [note, setNote] = useState('');

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (!currentSession) {
      // If no current session, try to get session details from API
      sessionApi.getSessionById(sessionId)
        .then((session) => {
          if (session && session.id === sessionId) {
            setSessionDetails(session);
          }
        })
        .catch(() => {
          // Session might be ended, that's okay
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      if (currentSession.id !== sessionId) {
        router.replace('/not-found');
      } else {
        setSessionDetails(currentSession);
        setIsLoading(false);
      }
    }
  }, [currentSession, sessionId, router]);

  const calculateSessionDuration = (session: Session) => {
    const startTime = new Date(session.start_time);
    const endTime = session.end_time ? new Date(session.end_time) : new Date();
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationMinutes = Math.ceil(durationMs / (1000 * 60));
    return durationMinutes;
  };

  const calculateTotalAmount = (session: Session) => {
    const durationMinutes = calculateSessionDuration(session);
    const pricePerMin = typeof session.price_on_min === 'string' ? parseFloat(session.price_on_min) : session.price_on_min;
    return durationMinutes * pricePerMin;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleGoHome = () => {
    clearSession();
    router.push('/workspace/discovery');
  };

  const handleViewReceipt = () => {
    // TODO: Implement receipt view functionality
    console.log('View receipt for session:', sessionId);
  };

  const handleStarClick = (idx: number) => {
    setRating(idx + 1);
  };

  const handleSubmit = () => {
    // Xử lý gửi feedback ở đây
    // alert(`Feedback: ${rating} sao, note: ${note}`);
    handleGoHome();
  };

  const handleSkip = () => {
    // Xử lý skip feedback ở đây
    // alert('Skip feedback');
    handleGoHome();
  };

  if (isLoading) {
    return (
      <Box sx={{
        height: '100vh',
        backgroundColor: rootStyle.backgroundColor,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!sessionDetails) {
    return (
      <Box sx={{
        height: '100vh',
        backgroundColor: rootStyle.backgroundColor,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        gap: 2,
      }}>
        <Typography variant="h6" color="text.secondary">
          Session not found
        </Typography>
        <Button variant="contained" onClick={handleGoHome}>
          Go Home
        </Button>
      </Box>
    );
  }

  const durationMinutes = calculateSessionDuration(sessionDetails);
  const totalAmount = calculateTotalAmount(sessionDetails);
  const pricePerMin = typeof sessionDetails.price_on_min === 'string' ? parseFloat(sessionDetails.price_on_min) : sessionDetails.price_on_min;

  return (
    <Box sx={{
      minHeight: '100vh',
      backgroundColor: '#FCFCF6',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      py: 4,
      px: 2,
    }}>
      <CheckCircleIcon sx={{ fontSize: 88, color: rootStyle.elementColor, mb: 2 }} />
      <Typography variant="h4" fontWeight={700} mb={2} sx={{
        textAlign: 'center',
        fontSize: "36px",
        fontFamily: rootStyle.titleFontFamily
      }}>
        Session Complete
      </Typography>
      <Typography sx={{
        textAlign: 'center',
        fontSize: "20px",
        fontWeight: 600,
        mb: 3,
      }}>
        Nice work - you stayed focused<br/>for {durationMinutes} minutes.
      </Typography>

      {/* Info Card */}
      <Box sx={{
        border: '1px solid #E0E0E0',
        borderRadius: 2,
        px: 3,
        py: 2.5,
        mb: 4,
        maxWidth: 340,
        width: '100%',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <AccessTimeIcon sx={{ mr: 1, color: '#185C3C' }} />
          <Typography sx={{
            fontSize: "20px",
            fontWeight: 600, flex: 1 }}>Focus Time</Typography>
          <Typography sx={{
            fontSize: "20px",
            fontWeight: 600,
          }}>{focusTime}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <LockIcon sx={{ mr: 1, color: '#185C3C' }} />
          <Typography sx={{
            fontSize: "20px",
            fontWeight: 600, flex: 1 }}>Status</Typography>
          <Typography sx={{
            fontSize: "20px",
            fontWeight: 600,
          }}>{status}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <EuroIcon sx={{ mr: 1, color: '#185C3C' }} />
          <Typography sx={{
            fontSize: "20px",
            fontWeight: 600, flex: 1 }}>Total Cost</Typography>
          <Typography sx={{
            fontSize: "20px",
            fontWeight: 600,
          }}>{totalCost}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CreditCardIcon sx={{ mr: 1, color: '#185C3C' }} />
          <Typography sx={{
            fontSize: "20px",
            fontWeight: 600, flex: 1 }}>{paymentMethod.type} •••• {paymentMethod.last4}</Typography>
          <IconButton size="small" sx={{ ml: 1 }}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Feedback */}
      <Typography sx={{ textAlign: 'center', fontWeight: 600, mb: 1, fontSize: '1.1rem' }}>
        How was your session?
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        {[0, 1, 2, 3, 4].map(idx => (
          <IconButton key={idx} onClick={() => handleStarClick(idx)}>
            <StarIcon sx={{ color: idx < rating ? '#185C3C' : '#E0E0E0', fontSize: 32 }} />
          </IconButton>
        ))}
      </Box>
      <TextField
        fullWidth
        placeholder="Add a note ..."
        value={note}
        onChange={e => setNote(e.target.value)}
        sx={{
          maxWidth: 340,
          height: "52px !important",
          mb: 3,
        }}
        InputProps={{
          style: { fontSize: '1rem', padding: 8 },
        }}
      />
      <Button
        variant="contained"
        fullWidth
        sx={{
          maxWidth: 340,
          fontWeight: 700,
          fontSize: '1rem',
          py: 1.5,
          mb: 2,
        }}
        onClick={handleSubmit}
      >
        Submit Feedback
      </Button>
      <Button
        variant="text"
        fullWidth
        sx={{
          maxWidth: 340,
          color: '#A2A2A2',
          fontWeight: 600,
          fontSize: '1rem',
        }}
        onClick={handleSkip}
      >
        Skip this time
      </Button>
    </Box>
  );
} 