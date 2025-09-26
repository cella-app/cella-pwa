"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Card,
  Typography,
  Button,
  SvgIcon,
} from "@mui/material";
import { Pause, Play, Lock, LockOpen } from "lucide-react";
import { rootStyle } from "@/theme";
import { Session, SessionStatusEnum } from "@/shared/data/models/Session";
import { pause, resume, getAmount } from '@/features/session/session.action';
import { useSessionStore } from '@/features/session/stores/session.store';
import { useRouter } from 'next/navigation';
import { MIN_AMOUNT } from '@/shared/config/payment';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { LOCAL_CURRENCY_CONFIG } from "@/shared/constants/constants";

interface SessionClockProps {
  session: Session;
}

const TRACKING_TIME = 15 * 1000;

const SessionClock: React.FC<SessionClockProps> = ({ session }) => {
  const router = useRouter();
  const {
    currentPause,
    pauseLogs,
    loadCurrentPause,
    loadPauseLogs
  } = useSessionStore();

  const [focusTime, setFocusTime] = useState(0);
  const [pauseTime, setPauseTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [hasRenderedOnce, setHasRenderedOnce] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [endSessionButtonText, setEndSessionButtonText] = useState("End Session");
  const [showMinAmountPopup, setShowMinAmountPopup] = useState(false);
  const [calculatedAmount, setCalculatedAmount] = useState(0);

  // Simplified state management
  const [isUserActionActive, setIsUserActionActive] = useState(false);
  const [lastUserActionTime, setLastUserActionTime] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState(Date.now());
  const [isNavigationReturn, setIsNavigationReturn] = useState(false);

  const focusInterval = useRef<NodeJS.Timeout | null>(null);
  const pauseInterval = useRef<NodeJS.Timeout | null>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const userActionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize time based on session data + localStorage persistence
  useEffect(() => {
    if (session?.start_time && !hasRenderedOnce) {
      const localKey = `session_time_${session.id}`;
      const savedTimes = localStorage.getItem(localKey);
      
      if (savedTimes) {
        // Restore from localStorage if available
        const parsed = JSON.parse(savedTimes);
        const timeDiff = Math.floor((Date.now() - parsed.timestamp) / 1000);
        
        if (parsed.isPaused) {
          // If was paused, add time difference to pause time
          setFocusTime(parsed.focusTime);
          setPauseTime(parsed.pauseTime + timeDiff);
        } else {
          // If was running, add time difference to focus time  
          setFocusTime(parsed.focusTime + timeDiff);
          setPauseTime(parsed.pauseTime);
        }
        
        console.log('Restored from localStorage:', { 
          savedFocus: parsed.focusTime, 
          savedPause: parsed.pauseTime, 
          timeDiff, 
          wasPaused: parsed.isPaused 
        });
      } else {
        // Calculate from server data
        const start = new Date(session.start_time).getTime();
        const now = Date.now();

        let totalPauseMs = 0;
        if (pauseLogs && pauseLogs.length > 0) {
          for (const log of pauseLogs) {
            if (log.pause_at && log.resume_at) {
              const pauseStart = new Date(log.pause_at).getTime();
              const pauseEnd = new Date(log.resume_at).getTime();
              totalPauseMs += Math.max(0, pauseEnd - pauseStart);
            }
          }
        }

        if (isPaused && currentPause?.pause_at) {
          const pauseStart = new Date(currentPause.pause_at).getTime();
          totalPauseMs += Math.max(0, now - pauseStart);
        }

        const focusSeconds = Math.floor((now - start - totalPauseMs) / 1000);
        setFocusTime(focusSeconds > 0 ? focusSeconds : 0);

        const totalPauseSeconds = Math.floor(totalPauseMs / 1000);
        setPauseTime(totalPauseSeconds > 0 ? totalPauseSeconds : 0);

        console.log('Initial time calculation from server:', { focusSeconds, totalPauseSeconds });
      }
    }
  }, [session?.start_time, session?.id, pauseLogs, currentPause, isPaused, hasRenderedOnce]);

  // Component initialization
  useEffect(() => {
    const timeout = setTimeout(() => setHasRenderedOnce(true), 100);
    return () => {
      clearTimeout(timeout);
      if (focusInterval.current) clearInterval(focusInterval.current);
      if (pauseInterval.current) clearInterval(pauseInterval.current);
    };
  }, []);

  // Tracking interval
  useEffect(() => {
    if (!session?.id || isPaused) return;
    const interval = setInterval(() => {
      // tracking(session.id).catch(console.error);
    }, TRACKING_TIME);
    return () => clearInterval(interval);
  }, [session?.id, isPaused]);

  // Focus time counter - simple client-side increment
  useEffect(() => {
    if (!isPaused && hasRenderedOnce) {
      focusInterval.current = setInterval(() => {
        setFocusTime((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(focusInterval.current!);
    }
    return () => clearInterval(focusInterval.current!);
  }, [isPaused, hasRenderedOnce]);

  // Pause time counter - simple client-side increment
  useEffect(() => {
    if (isPaused && hasRenderedOnce) {
      pauseInterval.current = setInterval(() => {
        setPauseTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (pauseInterval.current) clearInterval(pauseInterval.current);
    }
    return () => {
      if (pauseInterval.current) clearInterval(pauseInterval.current);
    };
  }, [isPaused, hasRenderedOnce]);


  // Load initial data and set initial pause state
  useEffect(() => {
    if (session?.id) {
      console.log(`Loading initial data for session ${session.id}, status: ${session.status}`);
      loadPauseLogs(session.id);
      loadCurrentPause(session.id);
      
      // Set initial pause state based on server status only on first load and not navigation return
      if (!hasRenderedOnce && !isNavigationReturn) {
        const serverIsPaused = session.status === SessionStatusEnum.PAUSING;
        console.log(`Setting initial UI state: ${serverIsPaused ? 'PAUSED' : 'RUNNING'} based on server status: ${session.status}`);
        setIsPaused(serverIsPaused);
      } else if (hasRenderedOnce) {
        console.log(`Skipping initial state set - component already rendered, current UI state: ${isPaused ? 'PAUSED' : 'RUNNING'}`);
      } else if (isNavigationReturn) {
        console.log(`Skipping initial state set - navigation return protection active, current UI state: ${isPaused ? 'PAUSED' : 'RUNNING'}`);
      }
    }
  }, [session?.id, session?.status, loadPauseLogs, loadCurrentPause, hasRenderedOnce, isNavigationReturn, isPaused]);

  // Server state sync (only when no user action and not navigation return)
  useEffect(() => {
    if (!isUserActionActive && !isNavigationReturn && session?.status !== undefined) {
      const timeSinceUserAction = Date.now() - lastUserActionTime;

      if (timeSinceUserAction > 8000) { // 8 seconds protection
        const serverIsPaused = session.status === SessionStatusEnum.PAUSING;
        const hasActivePause = currentPause !== null && currentPause.pause_at !== null && currentPause.resume_at === null;
        // If server status is PAUSING, consider it paused even if currentPause is null (API error)
        const shouldBePaused = serverIsPaused || hasActivePause;

        if (isPaused !== shouldBePaused) {
          console.log(`Server sync: ${shouldBePaused ? 'PAUSED' : 'RUNNING'} (server status: ${session.status}, hasActivePause: ${hasActivePause})`);
          setIsPaused(shouldBePaused);
        }
      }
    }
  }, [session?.status, currentPause, isPaused, isUserActionActive, lastUserActionTime, isNavigationReturn]);

  // Data-only background sync
  const syncDataOnly = useCallback(async (sessionId: string) => {
    const timeSinceUserAction = Date.now() - lastUserActionTime;
    const timeSinceLastSync = Date.now() - lastSyncTime;

    if (isUserActionActive || isNavigationReturn || timeSinceUserAction < 8000 || timeSinceLastSync < 10000) {
      console.log("Skipping data sync - protection active");
      return;
    }

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(async () => {
      try {
        console.log("Background data sync");
        await Promise.all([
          loadCurrentPause(sessionId),
          loadPauseLogs(sessionId)
        ]);
        setLastSyncTime(Date.now());
      } catch (error) {
        console.error("Background sync failed:", error);
      }
    }, 2000);
  }, [loadCurrentPause, loadPauseLogs, isUserActionActive, lastUserActionTime, lastSyncTime, isNavigationReturn]);

  // Focus/visibility handlers
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && session?.id) {
        console.log("Tab became visible - navigation return detected");
        
        // Restore UI state from localStorage if available
        const savedState = localStorage.getItem(`session_ui_state_${session.id}`);
        if (savedState) {
          const parsed = JSON.parse(savedState);
          console.log(`Restoring UI state from localStorage: ${parsed.isPaused ? 'PAUSED' : 'RUNNING'}`);
          setIsPaused(parsed.isPaused);
          // Clear the saved state after restoring
          localStorage.removeItem(`session_ui_state_${session.id}`);
        }
        
        // Set navigation return flag to prevent incorrect state sync
        setIsNavigationReturn(true);
        
        // Clear navigation protection after 5 seconds
        if (navigationTimeoutRef.current) {
          clearTimeout(navigationTimeoutRef.current);
        }
        
        navigationTimeoutRef.current = setTimeout(() => {
          setIsNavigationReturn(false);
          console.log("Navigation return protection cleared");
          
          // Now allow data sync after protection period
          if (session?.id) {
            console.log("Safe data sync after navigation return");
            syncDataOnly(session.id);
          }
        }, 5000);
      }
    };

    const handleFocus = () => {
      if (session?.id && !isNavigationReturn) {
        console.log("Window focused - scheduling data sync");
        syncDataOnly(session.id);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      if (navigationTimeoutRef.current) clearTimeout(navigationTimeoutRef.current);
    };
  }, [session?.id, syncDataOnly, isNavigationReturn]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Main toggle handler - simplified with proper backend validation
  const handleToggle = async () => {
    if (!session?.id || isLoading) return;

    console.log("User toggle action started");

    setIsLoading(true);
    setIsUserActionActive(true);
    setLastUserActionTime(Date.now());

    // Clear any pending syncs
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    try {
      // Get fresh server state before validation
      console.log("Loading fresh server state...");
      await Promise.all([
        loadCurrentPause(session.id),
        loadPauseLogs(session.id)
      ]);

      // Wait for state to propagate
      await new Promise(resolve => setTimeout(resolve, 200));

      const currentServerStatus = session?.status;
      const hasActivePause = !!(currentPause && currentPause.pause_at && !currentPause.resume_at);
      const serverIsPaused = currentServerStatus === SessionStatusEnum.PAUSING || hasActivePause;

      const intendedAction = isPaused ? 'resume' : 'pause';

      console.log("Validation state:", {
        intendedAction,
        currentServerStatus,
        hasActivePause,
        serverIsPaused,
        uiIsPaused: isPaused,
        currentPauseExists: !!currentPause
      });

      // CRITICAL: Match backend validation logic exactly
      if (intendedAction === 'pause') {
        // Backend isValidToPause() requires status === RUNNING
        // Be more lenient: allow pause if status is RUNNING OR if UI shows running (not paused)
        const canPause = currentServerStatus === SessionStatusEnum.RUNNING || !isPaused;
        
        console.log(`Pause validation - server status: ${currentServerStatus}, UI paused: ${isPaused}, can pause: ${canPause}`);
        
        if (!canPause) {
          console.log(`Cannot pause: status is ${currentServerStatus} and UI is already paused`);
          setIsPaused(serverIsPaused);
          setIsLoading(false);
          return;
        }
      }

      if (intendedAction === 'resume') {
        // For resume, allow if:
        // 1. UI thinks it's paused, OR
        // 2. Server status is PAUSING (even if currentPause is null due to API error)
        const canResume = isPaused || currentServerStatus === SessionStatusEnum.PAUSING;
        
        console.log(`Resume validation - UI paused: ${isPaused}, server status: ${currentServerStatus}, can resume: ${canResume}`);
        
        if (!canResume) {
          console.log("Cannot resume: neither UI nor server indicates paused state");
          setIsPaused(false);
          setIsLoading(false);
          return;
        }
      }

      // Optimistic UI update
      const newUIState = !isPaused;
      setIsPaused(newUIState);

      // Immediately save to localStorage on toggle
      localStorage.setItem(`session_time_${session.id}`, JSON.stringify({
        focusTime,
        pauseTime,
        isPaused: newUIState,
        timestamp: Date.now()
      }));
      console.log('Saved to localStorage on toggle:', { focusTime, pauseTime, newUIState });

      // Execute API call
      if (intendedAction === 'resume') {
        console.log("Executing resume...");
        await resume(session.id);
        await new Promise(resolve => setTimeout(resolve, 1000));
        await loadPauseLogs(session.id);
      } else {
        console.log("Executing pause...");
        await pause(session.id);
        await new Promise(resolve => setTimeout(resolve, 1000));
        await loadCurrentPause(session.id);
      }

      console.log("Toggle action completed successfully");

    } catch (error) {
      console.error("Toggle action failed:", error);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errorMessage = (error as any)?.message || String(error);

      if (errorMessage.includes('pause invalid') ||
        errorMessage.includes('already paused') ||
        errorMessage.includes('Cannot pause') ||
        errorMessage.includes('Cannot resume')) {

        console.log("State conflict - syncing with server...");

        try {
          // Reload fresh state
          await Promise.all([
            loadCurrentPause(session.id),
            loadPauseLogs(session.id)
          ]);

          await new Promise(resolve => setTimeout(resolve, 200));

          // Sync UI with actual server state
          const freshServerStatus = session?.status;
          const freshHasActivePause = currentPause !== null && currentPause.pause_at !== null && currentPause.resume_at === null;
          const freshServerState = freshServerStatus === SessionStatusEnum.PAUSING || freshHasActivePause;

          setIsPaused(freshServerState);
          console.log(`UI synced to server: ${freshServerState ? 'PAUSED' : 'RUNNING'}`);

        } catch (syncError) {
          console.error("Failed to sync after error:", syncError);
        }
      }

    } finally {
      setIsLoading(false);

      // Extended user action protection
      if (userActionTimeoutRef.current) {
        clearTimeout(userActionTimeoutRef.current);
      }

      userActionTimeoutRef.current = setTimeout(() => {
        setIsUserActionActive(false);
        console.log("User action protection cleared");
      }, 10000); // 10 second protection
    }
  };

  const handleEndSession = async () => {
    if (!session?.id || isLoading) return;

    setIsLoading(true);
    setEndSessionButtonText("Calculating amount...");

    try {
      const amountResponse = await getAmount(session.id);
      const amount = amountResponse.amount;
      setCalculatedAmount(amount);

      if (amount < MIN_AMOUNT) {
        setShowMinAmountPopup(true);
        setIsLoading(false);
        setEndSessionButtonText("End Session");
      } else {
        // Clear time tracking data on session end
        localStorage.removeItem(`session_time_${session.id}`);
        
        // Save UI state before navigation
        localStorage.setItem(`session_ui_state_${session.id}`, JSON.stringify({
          isPaused,
          timestamp: Date.now()
        }));
        console.log(`Saved UI state before navigation: ${isPaused ? 'PAUSED' : 'RUNNING'}`);
        router.push(`/session/${session.id}/checkout`);
      }
    } catch (error) {
      console.error("Error getting session amount:", error);
      setEndSessionButtonText("End Session");
      setIsLoading(false);
    }
  };

  const handleConfirmEndSession = async () => {
    setShowMinAmountPopup(false);
    if (!session?.id) return;
    
    // Clear time tracking data on session end
    localStorage.removeItem(`session_time_${session.id}`);
    
    // Save UI state before navigation
    localStorage.setItem(`session_ui_state_${session.id}`, JSON.stringify({
      isPaused,
      timestamp: Date.now()
    }));
    console.log(`Saved UI state before navigation (min amount): ${isPaused ? 'PAUSED' : 'RUNNING'}`);
    router.push(`/session/${session.id}/checkout`);
  };

  const handleCloseMinAmountPopup = () => {
    setShowMinAmountPopup(false);
    setEndSessionButtonText("End Session");
    setIsLoading(false);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      if (userActionTimeoutRef.current) clearTimeout(userActionTimeoutRef.current);
      if (navigationTimeoutRef.current) clearTimeout(navigationTimeoutRef.current);
    };
  }, []);

  const strokeWidth = 12;
  const radius = 130 - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.15;
  const dashArray = `${arcLength} ${circumference}`;
  const fakeMaxTime = 60;
  const currentTime = isPaused ? pauseTime : focusTime;
  const progress = (currentTime % fakeMaxTime) / fakeMaxTime;
  const rotation = progress * 360;

  return (
    <Card
      sx={{
        height: "100vh",
        p: 4,
        background: "transparent",
        width: "100%",
        maxWidth: 400,
        textAlign: "center",
        border: "none !important",
        boxShadow: "none !important",
        fontFamily: rootStyle.mainFontFamily,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "center",
      }}
    >
      {/* Toggle */}
      <Box
        onClick={handleToggle}
        sx={{
          width: 44,
          height: 24,
          borderRadius: 12,
          backgroundColor: !isPaused ? rootStyle.elementColor : "#e0e0e0",
          position: "relative",
          cursor: isLoading ? "not-allowed" : "pointer",
          opacity: isLoading ? 0.7 : 1,
          alignSelf: "flex-end",
          mb: 2,
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: "2px",
            left: !isPaused ? "22px" : "2px",
            width: 20,
            height: 20,
            bgcolor: "white",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.3s ease",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          }}
        >
          <SvgIcon fontSize="inherit">
            {!isPaused ? <LockOpen fontSize="small" /> : <Lock fontSize="small" />}
          </SvgIcon>
        </Box>
      </Box>

      {/* Status */}
      <Typography variant="h3" fontWeight={700} mb={2}>
        {isPaused ? "Session Paused" : "In Session"}
      </Typography>

      {/* Clock Circle */}
      <Box
        sx={{
          position: "relative",
          width: 260,
          height: 260,
          mx: "auto",
          mb: 3,
          "@media (max-width:330px)": { width: 200, height: 200 },
          "@media (max-width:280px)": { width: 160, height: 160 },
        }}
      >
        <svg width="100%" height="100%" viewBox="0 0 260 260" style={{ transform: "rotate(-90deg)" }}>
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="10%" stopColor="#20A48C" stopOpacity="1" />
              <stop offset="75%" stopColor="#0C3E35" stopOpacity="1" />
              <stop offset="100%" stopColor="#20A48C" stopOpacity="1" />
            </linearGradient>
          </defs>
          <circle cx="130" cy="130" r={radius} stroke="#20A48C" strokeWidth={strokeWidth} fill="transparent" />
          <circle
            cx="130"
            cy="130"
            r={radius}
            stroke="url(#progressGradient)"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={dashArray}
            strokeDashoffset="0"
            strokeLinecap="round"
            style={{
              transition: hasRenderedOnce ? "transform 0.5s ease-out" : "none",
              transform: `rotate(${rotation}deg)`,
              transformOrigin: "center",
            }}
          />
        </svg>

        <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
          <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: "36px", sm: "60px" } }}>
            {isPaused ? formatTime(pauseTime) : formatTime(focusTime)}
          </Typography>
          <Typography
            color="text.secondary"
            variant="h6"
            sx={{
              fontSize: "24px",
              fontWeight: 700,
              fontFamily: rootStyle.mainFontFamily,
              mb: 2,
              display: isPaused ? "none" : "block",
              color: "black",
            }}
          >
            Stay focused
          </Typography>
          <Typography
            color="text.secondary"
            variant="body1"
            sx={{
              fontSize: "16px",
              fontWeight: 200,
              fontFamily: rootStyle.mainFontFamily,
              display: isPaused ? "block" : "none",
              textAlign: "center",
              color: "black",
            }}
          >
            Free 5-minute break after 50 minutes!
          </Typography>
        </Box>
      </Box>

      <Typography variant="h5" sx={{ fontFamily: rootStyle.mainFontFamily, mb: 2 }}>
        {isPaused ? "Pod Locked" : "Pod Unlocked"}
      </Typography>

      <Button
        variant="contained"
        fullWidth
        onClick={handleToggle}
        sx={{ mb: 4, fontWeight: 600, fontSize: 16 }}
        startIcon={!isPaused ? <Pause /> : <Play />}
        disabled={isLoading}
      >
        {!isPaused ? "Pause Session" : "Resume Session"}
      </Button>

      <Button
        variant="outlined"
        fullWidth
        color="error"
        onClick={handleEndSession}
        disabled={isLoading}
      >
        {endSessionButtonText}
      </Button>

      <Dialog
        open={showMinAmountPopup}
        onClose={handleCloseMinAmountPopup}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 3,
              p: { xs: 1, sm: 2 },
              background: rootStyle.backgroundColor,
              "@media (max-width:330px)": { width: "calc(100% - 10pt)", margin: "10pt" },
              "@media (max-width:300px)": { width: "calc(100% - 5pt)", margin: "5pt" },
              "@media (max-width:280px)": { width: "100%", margin: "2pt" },
            },
          },
        }}
      >
        <DialogTitle sx={{ textAlign: "center" }}>Minimum Amount Required</DialogTitle>
        <DialogContent sx={{ pb: 0, textAlign: "center" }}>
          <DialogContentText sx={{ fontSize: 16, color: rootStyle.descriptionColor, mb: 2 }}>
            {`The minimum amount to pay is ${MIN_AMOUNT.toLocaleString("en-US", LOCAL_CURRENCY_CONFIG)}. Your current calculated amount is ${calculatedAmount.toLocaleString("en-US", LOCAL_CURRENCY_CONFIG)}. Do you still want to end the session?`}
          </DialogContentText>
        </DialogContent>
        <DialogActions
          sx={{
            justifyContent: "center",
            gap: 3,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: "center",
            margin: 0,
            "@media (max-width:330px)": { "& .MuiButton-root": { padding: "6px 12px" } },
          }}
          disableSpacing={true}
        >
          <Button
            onClick={handleCloseMinAmountPopup}
            disabled={isLoading}
            variant="outlined"
            size="small"
            sx={{ py: { xs: 1, sm: 0.5 }, textTransform: 'none', margin: 0 }}
          >
            Keep session
          </Button>
          <Button
            onClick={handleConfirmEndSession}
            color="error"
            disabled={isLoading}
            variant="contained"
            size="small"
            sx={{ py: { xs: 1, sm: 0.5 }, textTransform: 'none', margin: 0 }}
          >
            End anyway
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default SessionClock;
