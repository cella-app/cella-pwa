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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { rootStyle } from "@/theme";
import { BillingSession, BillingSummarySession, Session, SessionStatusEnum } from '@/shared/data/models/Session';
import { sessionApi } from '@/shared/api/session.api';
import { feedbackReserve } from '@/features/reservation/reservation.action';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockIcon from '@mui/icons-material/Lock';
import EuroIcon from '@mui/icons-material/Euro';
import StarIcon from '@mui/icons-material/Star';
import Pause from '@mui/icons-material/Pause';
import PlayArrow from '@mui/icons-material/PlayArrow';
import LockOpen from '@mui/icons-material/LockOpen';
import { useSessionStore } from '@/features/session/stores/session.store';
import { LOCAL_CURRENCY_CONFIG } from '@/shared/constants/constants';

export default function SessionCompletePage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.sessionId as string;
  const { clearSession } = useSessionStore();

  const [sessionDetails, setSessionDetails] = useState<Session | null>(null);
  const [billing, setBilling] = useState<BillingSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [rating, setRating] = useState(0);
  const [note, setNote] = useState('');

  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summary, setSummary] = useState<BillingSummarySession | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    async function fetchSessionAndBilling() {
      setIsLoading(true);
      try {
        const session = await sessionApi.getSessionById(sessionId);
        if (!session) {
          router.replace('/');
        } else if (session.status !== SessionStatusEnum.ENDED) {
          router.replace(`/session/${session.id}/progress`);
        } else {
          setSessionDetails(session);
          const billingRes = await sessionApi.getBilling(sessionId);
          setBilling(billingRes);
        }
      } catch {
        router.replace('/');
      } finally {
        setIsLoading(false);
      }
    }
    if (sessionId) fetchSessionAndBilling();
  }, [sessionId, router]);


  const handleGoHome = () => {
    clearSession()
    router.push('/workspace/discovery');
  };

  const handleStarClick = (idx: number) => {
    setRating(idx + 1);
  };

  const handleSubmit = async () => {
    if (sessionDetails?.workspace_pod_reserve && rating > 0) {
      try {
        await feedbackReserve(sessionDetails.workspace_pod_reserve, rating, note || null);
        handleGoHome();
      } catch (error) {
        console.error('Feedback submission failed:', error);
        // Still go home even if feedback fails
        handleGoHome();
      }
    } else {
      handleGoHome();
    }
  };

  const handleSkip = () => {
    handleGoHome();
  };

  const handleOpenSummary = async () => {
    setSummaryOpen(true);
    setSummaryLoading(true);
    try {
      const res = await sessionApi.getBillingSummary(sessionId);
      setSummary(res);
    } catch (err) {
      console.error(err)
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleCloseSummary = () => setSummaryOpen(false);

  // Helper to format ms to 'X hour(s) Y min(s) Z s'
  function formatMs(ms: number) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    let str = '';
    if (hours > 0) str += `${hours} hour${hours > 1 ? 's' : ''} `;
    if (minutes > 0 || hours > 0) str += `${minutes} min${minutes > 1 ? 's' : ''} `;
    str += `${seconds} s`;
    return str.trim();
  }

  // Helper for float minutes (extra_paused_minutes)
  function formatFloatMin(min: number) {
    const mins = Math.floor(min);
    const secs = Math.round((min - mins) * 60);
    let str = '';
    if (mins > 0) str += `${mins} min${mins > 1 ? 's' : ''} `;
    str += `${secs} s`;
    return str.trim();
  }

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

  if (!sessionDetails || !billing) {
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
          Billing info not found
        </Typography>
        <Button variant="contained" onClick={handleGoHome}>
          Go Home
        </Button>
      </Box>
    );
  }

  const totalMinutes = Math.round(Number(billing.focus_time));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const focusTimeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

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
        {(() => {
          const totalMinutes = Math.ceil(Number(billing.focus_time) / 60);
          if (totalMinutes >= 60) {
            const totalHours = Math.ceil(totalMinutes / 60);
            return (
              <>Nice work – you stayed focused<br />for {totalHours} hour{totalHours > 1 ? 's' : ''}.</>
            );
          }
          return (
            <>Nice work – you stayed focused<br />for {totalMinutes} minute{totalMinutes > 1 ? 's' : ''}.</>
          );
        })()}
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
          <Typography sx={{ fontSize: "20px", fontWeight: 600, flex: 1 }}>Focus Time</Typography>
          <Typography sx={{ fontSize: "20px", fontWeight: 600 }}>{focusTimeStr}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <LockIcon sx={{ mr: 1, color: '#185C3C' }} />
          <Typography sx={{ fontSize: "20px", fontWeight: 600, flex: 1 }}>Status</Typography>
          <Typography sx={{ fontSize: "20px", fontWeight: 600 }}>{billing.status == "available" ? "Locked" : "Unlocked"}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <EuroIcon sx={{ mr: 1, color: '#185C3C' }} />
          <Typography sx={{ fontSize: "20px", fontWeight: 600, flex: 1 }}>Total Cost</Typography>
          <Typography
            sx={{ fontSize: "20px", fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
            onClick={handleOpenSummary}
          >
            {Number(billing.total_cost).toLocaleString('en-US', LOCAL_CURRENCY_CONFIG )}
          </Typography>
        </Box>
      </Box>

      {/* Feedback */}
      <Typography sx={{ textAlign: 'center', fontWeight: 600, mb: 1, fontSize: '1.1rem' }}>
        How was your session?
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        {[0, 1, 2, 3, 4].map(idx => (
          <IconButton key={idx} onClick={() => handleStarClick(idx)} sx={{ p: 1.5, minWidth: 44, minHeight: 44 }}>
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
          minHeight: "48px !important",
          mb: 3,
          '& .MuiInputBase-root': {
            minHeight: "48px !important",
            paddingY: 1.5,
            alignItems: 'center',
          },
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

      <Dialog open={summaryOpen} onClose={handleCloseSummary} maxWidth="xs" fullWidth>
        <DialogTitle sx={{
          background: rootStyle.elementColor,
          color: 'white',
          fontFamily: rootStyle.titleFontFamily,
          fontWeight: 700,
          fontSize: 22,
          letterSpacing: 1,
          textAlign: 'center',
          py: 2,
          mb: 1,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
        }}>
          Session Billing Details
        </DialogTitle>
        <DialogContent dividers sx={{ background: rootStyle.backgroundColor, fontFamily: rootStyle.mainFontFamily }}>
          {summaryLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 120 }}>
              <CircularProgress size={32} sx={{ color: rootStyle.elementColor }} />
            </Box>
          ) : summary ? (
            <Box sx={{ fontSize: 16, color: rootStyle.textColor }}>
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <AccessTimeIcon sx={{ color: rootStyle.elementColor, mr: 1 }} />
                <b>Total time run:</b>
                <Box component="span" sx={{ ml: 1, color: rootStyle.elementColor, fontWeight: 700 }}>{formatMs(summary.total_time_run)}</Box>
              </Box>
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <Pause sx={{ color: '#E0A800', mr: 1 }} />
                <b>Paused time:</b>
                <Box component="span" sx={{ ml: 1, color: '#E0A800', fontWeight: 700 }}>{formatMs(summary.paused_time)}</Box>
              </Box>
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <PlayArrow sx={{ color: '#20A48C', mr: 1 }} />
                <b>Active (focus) time:</b>
                <Box component="span" sx={{ ml: 1, color: '#20A48C', fontWeight: 700 }}>{formatMs(summary.active_time)}</Box>
              </Box>
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <LockIcon sx={{ color: rootStyle.elementColor, mr: 1 }} />
                  <b>Free paused time:</b>
                <Box component="span" sx={{ ml: 1, color: rootStyle.elementColor, fontWeight: 700 }}>{summary.pause_allowance} min</Box>
              </Box>
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <LockOpen sx={{ color: '#BDBDBD', mr: 1 }} />
                <b>Charged paused time:</b>
                <Box component="span" sx={{ ml: 1, color: '#BDBDBD', fontWeight: 700 }}>{formatFloatMin(Number(summary.extra_paused_minutes))}</Box>
              </Box>
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <EuroIcon sx={{ color: rootStyle.elementColor, mr: 1 }} />
                <b>Price per minute:</b>
                  <Box component="span" sx={{ ml: 1, color: rootStyle.elementColor, fontWeight: 700 }}>{summary.price_per_minute.toLocaleString('en-US', LOCAL_CURRENCY_CONFIG)}</Box>
                </Box>
                <hr></hr>
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <EuroIcon sx={{ color: '#185C3C', mr: 1, fontSize: 24 }} />
                  <b style={{ fontSize: 24 }}>Total fee:</b>
                <Box component="span" sx={{ ml: 1, color: '#185C3C', fontWeight: 900, fontSize: 24 }}>{summary.total_fee.toLocaleString('en-US', LOCAL_CURRENCY_CONFIG)}</Box>
              </Box>
            </Box>
          ) : (
            <Typography color="error">No summary data found.</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ background: rootStyle.backgroundColor, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, justifyContent: 'center' }}>
          <Box sx={{ width: '100%' }}>
            <Button onClick={handleCloseSummary} sx={{ color: rootStyle.elementColor, fontWeight: 700, width: '100%' }}>Close</Button>
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 