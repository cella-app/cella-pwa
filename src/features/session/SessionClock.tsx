/* eslint-disable @typescript-eslint/no-explicit-any */
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
// import { tracking, pause, resume, end, getAmount } from '@/features/session/session.action';
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
    setCurrentPause,
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

  // New states for sync logic
  const [isUserAction, setIsUserAction] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(Date.now());
  const [localState, setLocalState] = useState<'focus' | 'pause' | null>(null);
  
  // Anti-spam protection
  const [lastActionTime, setLastActionTime] = useState(0);
  const [clickCount, setClickCount] = useState(0);
  const [isThrottled, setIsThrottled] = useState(false);
  const throttleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const focusInterval = useRef<NodeJS.Timeout | null>(null);
  const pauseInterval = useRef<NodeJS.Timeout | null>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced sync function - safer approach
  const debouncedSync = useCallback((sessionId: string) => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(async () => {
      // Only sync if no recent user action (extended to 5 seconds)
      const timeSinceLastAction = Date.now() - lastSyncTime;
      if (!isUserAction && timeSinceLastAction > 5000) {
        console.log("🔄 Safe sync: Updating from server");
        try {
          await loadPauseLogs(sessionId);
          await loadCurrentPause(sessionId);
          setLastSyncTime(Date.now());
        } catch (error) {
          console.error("Error syncing session data:", error);
        }
      } else {
        console.log("🚫 Sync blocked: Recent user action or user action in progress");
      }
    }, 1000); // Increased debounce to 1 second
  }, [loadPauseLogs, loadCurrentPause, isUserAction, lastSyncTime]);

  useEffect(() => {
    if (session?.start_time) {
      const start = new Date(session.start_time).getTime();
      const now = Date.now();

      // Total pause time (ms)
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
      // If currently PAUSING, add current pause time
      if (isPaused && currentPause?.pause_at) {
        const pauseStart = new Date(currentPause.pause_at).getTime();
        totalPauseMs += Math.max(0, now - pauseStart);
      }

      const focusSeconds = Math.floor((now - start - totalPauseMs) / 1000);
      setFocusTime(focusSeconds > 0 ? focusSeconds : 0);

      // Only set pauseTime if we're not currently paused (to avoid overriding the real-time increment)
      if (!isPaused) {
        const totalPauseSeconds = Math.floor(totalPauseMs / 1000);
        setPauseTime(totalPauseSeconds > 0 ? totalPauseSeconds : 0);
      }
    }
  }, [session?.start_time, pauseLogs, isPaused, currentPause]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setHasRenderedOnce(true);
    }, 100);
    
    // Clear any stale local state when component mounts
    console.log("🔄 Component mounted - clearing stale local state");
    setLocalState(null);
    setIsUserAction(false);
    
    return () => {
      clearTimeout(timeout);
      if (focusInterval.current) {
        clearInterval(focusInterval.current);
      }
      if (pauseInterval.current) {
        clearInterval(pauseInterval.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!session?.id || isPaused) return;

    const interval = setInterval(() => {
      // tracking(session.id).catch(console.error);
    }, TRACKING_TIME);

    return () => clearInterval(interval);
  }, [session?.id, isPaused]);

  useEffect(() => {
    if (!isPaused) {
      focusInterval.current = setInterval(() => {
        setFocusTime((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(focusInterval.current!);
    }
    return () => clearInterval(focusInterval.current!);
  }, [isPaused]);

  // Keep pause interval for real-time updates, but only increment when paused
  useEffect(() => {
    if (isPaused) {
      pauseInterval.current = setInterval(() => {
        setPauseTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (pauseInterval.current) {
        clearInterval(pauseInterval.current);
      }
    }
    return () => {
      if (pauseInterval.current) {
        clearInterval(pauseInterval.current);
      }
    };
  }, [isPaused]);

  // Updated useEffect for session status - safer conflict resolution
  useEffect(() => {
    // Priority system: localState > isUserAction > server state
    if (localState !== null) {
      // Use local state when available (user just acted)
      const shouldPause = localState === 'pause';
      if (isPaused !== shouldPause) {
        console.log(`🎯 Using local state: ${localState}`);
        setIsPaused(shouldPause);
      }
    } else if (!isUserAction) {
      // Only update from server if no local state and no user action
      const timeSinceLastAction = Date.now() - lastSyncTime;
      if (timeSinceLastAction > 5000) {
        console.log("🔄 Updating from server state");
        if (session?.status === SessionStatusEnum.PAUSING) {
          setIsPaused(true);
          if (session.id) {
            loadCurrentPause(session.id);
          }
          // Initialize pauseTime when entering pause state
          if (session?.start_time) {
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
            const totalPauseSeconds = Math.floor(totalPauseMs / 1000);
            setPauseTime(totalPauseSeconds > 0 ? totalPauseSeconds : 0);
          }
        } else {
          setIsPaused(false);
          setCurrentPause(null);
        }
      } else {
        console.log("🚫 Server update blocked: Recent user action");
      }
    }
  }, [session?.status, session?.id, session?.start_time, pauseLogs, loadCurrentPause, setCurrentPause, isUserAction, localState, lastSyncTime, isPaused]);

  useEffect(() => {
    if (session?.id) {
      console.log("🔄 Session ID changed - loading fresh data");
      loadPauseLogs(session.id);
      
      // Force sync with server state when session changes
      setTimeout(() => {
        console.log("🎯 Syncing with server state after session change");
        setLocalState(null); // Clear any local override
        setIsUserAction(false); // Allow server state to take precedence
        setLastSyncTime(Date.now());
      }, 500);
    }
  }, [session?.id, loadPauseLogs]);

  // Force sync with actual server state when session data changes
  useEffect(() => {
    if (session?.id && session?.status !== undefined) {
      // Clear local state override when we get fresh session data
      const shouldPause = session.status === SessionStatusEnum.PAUSING;
      
      console.log(`🎯 Fresh session data: status=${session.status}, shouldPause=${shouldPause}, currentIsPaused=${isPaused}`);
      
      // If there's a mismatch and no recent user action, sync with server
      if (isPaused !== shouldPause && localState === null && !isUserAction) {
        console.log(`🔄 Syncing UI with server state: ${shouldPause ? 'PAUSE' : 'RESUME'}`);
        setIsPaused(shouldPause);
        
        if (shouldPause && session.id) {
          loadCurrentPause(session.id);
        } else {
          setCurrentPause(null);
        }
      }
    }
  }, [session?.status, session?.id, isPaused, localState, isUserAction, loadCurrentPause, setCurrentPause]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Updated visibility change handler - more conservative
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("👁️ User came back to the tab / screen");

        // Clear local state after user returns (allow server sync later)
        setTimeout(() => {
          if (!isUserAction) {
            console.log("🧹 Clearing local state after tab return");
            setLocalState(null);
          }
        }, 2000);

        // Only sync if it's been a while and no recent user action
        const timeSinceLastSync = Date.now() - lastSyncTime;
        if (session?.id && timeSinceLastSync > 10000 && !isUserAction && localState === null) {
          console.log("🔄 Syncing after tab return");
          debouncedSync(session.id);
        }
      }
    };

    const handleFocus = () => {
      console.log("🎯 Window focused again");
      const timeSinceLastSync = Date.now() - lastSyncTime;
      if (session?.id && timeSinceLastSync > 10000 && !isUserAction && localState === null) {
        console.log("🔄 Syncing after window focus");
        debouncedSync(session.id);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [session?.id, debouncedSync, lastSyncTime, isUserAction, localState]);

  // Anti-spam protection function
  const isActionAllowed = useCallback(() => {
    const now = Date.now();
    const timeSinceLastAction = now - lastActionTime;
    
    // Minimum 2 seconds between actions
    if (timeSinceLastAction < 2000) {
      console.log("🚫 Action blocked: Too fast! Wait 2 seconds between actions");
      
      // Show throttle state
      setIsThrottled(true);
      if (throttleTimeoutRef.current) clearTimeout(throttleTimeoutRef.current);
      throttleTimeoutRef.current = setTimeout(() => {
        setIsThrottled(false);
      }, 2000 - timeSinceLastAction);
      
      return false;
    }
    
    // Track click count for spam detection
    if (timeSinceLastAction < 10000) { // Within 10 seconds
      setClickCount(prev => prev + 1);
      
      // More than 5 clicks in 10 seconds = spam
      if (clickCount >= 5) {
        console.log("🚫 Action blocked: Spam detected! Please wait...");
        
        // Show throttle state for longer
        setIsThrottled(true);
        if (throttleTimeoutRef.current) clearTimeout(throttleTimeoutRef.current);
        throttleTimeoutRef.current = setTimeout(() => {
          setIsThrottled(false);
          setClickCount(0);
          console.log("🔄 Anti-spam reset: Actions allowed again");
        }, 30000);
        
        return false;
      }
    } else {
      // Reset click count if more than 10 seconds passed
      setClickCount(0);
    }
    
    setLastActionTime(now);
    return true;
  }, [lastActionTime, clickCount]);

  // Updated handleToggle with anti-spam protection
  const handleToggle = async () => {
    if (!session?.id || isLoading) return;

    // Anti-spam check
    if (!isActionAllowed()) {
      return;
    }

    setIsLoading(true);
    setIsUserAction(true); // Mark as user action
    console.log("🎮 handleToggle: Starting user action");

    // Double-check current server state before action
    const currentServerStatus = session?.status;
    const serverIsPaused = currentServerStatus === SessionStatusEnum.PAUSING;
    const clientIsPaused = isPaused;
    
    // Also check if there's an active pause record
    const hasActivePause = currentPause && currentPause.pause_at && !currentPause.resume_at;

    console.log(`🔍 State check: server=${currentServerStatus}, client=${clientIsPaused ? 'PAUSED' : 'RUNNING'}, activePause=${!!hasActivePause}`);

    // If there's a mismatch, sync first then prevent action
    if (serverIsPaused !== clientIsPaused) {
      console.log("⚠️ State mismatch detected! Syncing with server...");
      setIsPaused(serverIsPaused);
      setLocalState(serverIsPaused ? 'pause' : 'focus');
      setIsLoading(false);
      setIsUserAction(false);
      
      // Clear local state after sync
      setTimeout(() => {
        setLocalState(null);
        console.log("🔄 State synced, local override cleared");
      }, 2000);
      
      return; // Prevent action when states don't match
    }

    // Additional validation: check for double pause attempt
    if (!isPaused && (serverIsPaused || hasActivePause)) {
      console.log("⚠️ Cannot pause: Session is already paused on server");
      console.log("📋 Server details:", { 
        status: currentServerStatus, 
        hasActivePause, 
        currentPause: currentPause ? {
          id: currentPause.id,
          pause_at: currentPause.pause_at,
          resume_at: currentPause.resume_at
        } : null
      });
      
      // Force sync to paused state
      setIsPaused(true);
      setLocalState('pause');
      setIsLoading(false);
      setIsUserAction(false);
      
      setTimeout(() => {
        setLocalState(null);
        console.log("🔄 Forced sync to paused state");
      }, 2000);
      
      return;
    }

    // Additional validation: check for double resume attempt  
    if (isPaused && (!serverIsPaused && !hasActivePause)) {
      console.log("⚠️ Cannot resume: Session is not paused on server");
      console.log("📋 Server details:", { 
        status: currentServerStatus, 
        hasActivePause, 
        currentPause: currentPause ? {
          id: currentPause.id,
          resume_at: currentPause.resume_at
        } : null
      });
      
      // Force sync to running state
      setIsPaused(false);
      setLocalState('focus');
      setIsLoading(false);
      setIsUserAction(false);
      
      setTimeout(() => {
        setLocalState(null);
        console.log("🔄 Forced sync to running state");
      }, 2000);
      
      return;
    }

    const originalPauseState = isPaused;
    const newState = isPaused ? 'focus' : 'pause';

    // Set local state immediately for responsive UI
    setLocalState(newState);
    setIsPaused(!isPaused);

    try {
      if (isPaused) {
        // Resume session - validate it's actually paused first
        if (currentServerStatus !== SessionStatusEnum.PAUSING) {
          throw new Error(`Cannot resume: session is not paused (status: ${currentServerStatus})`);
        }
        console.log("▶️ Resuming session");
        await resume(session.id);
        
        // Wait longer for server to update
        await new Promise(resolve => setTimeout(resolve, 800));
        await loadPauseLogs(session.id);

      } else {
        // Pause session - validate it's actually running first  
        if (currentServerStatus === SessionStatusEnum.PAUSING) {
          throw new Error(`Cannot pause: session is already paused (status: ${currentServerStatus})`);
        }
        console.log("⏸️ Pausing session");
        await pause(session.id);
        
        // Wait longer for server to update  
        await new Promise(resolve => setTimeout(resolve, 800));
        await loadCurrentPause(session.id);
      }

      setLastSyncTime(Date.now());
      console.log(`✅ handleToggle: Success - ${newState}`);

    } catch (error) {
      console.error("❌ Error toggling session:", error);
      
      // Check if it's a state mismatch error
      const errorMessage = (error as any)?.message || String(error) || '';
      if (errorMessage.includes('already paused') || errorMessage.includes('pause invalid') || 
          errorMessage.includes('Cannot pause') || errorMessage.includes('Cannot resume')) {
        console.log("🔄 State mismatch error - forcing sync with server");
        
        // Force reload current session data to get accurate state
        if (session?.id) {
          await loadCurrentPause(session.id);
          await loadPauseLogs(session.id);
        }
        
        // Sync UI with actual server state  
        setIsPaused(serverIsPaused);
        setLocalState(serverIsPaused ? 'pause' : 'focus');
      } else {
        // Revert to original state for other errors
        setIsPaused(originalPauseState);
        setLocalState(originalPauseState ? 'pause' : 'focus');
      }
    } finally {
      setIsLoading(false);

      // Keep user action flag longer and clear local state more conservatively
      setTimeout(() => {
        setIsUserAction(false);
        console.log("🏁 handleToggle: User action flag cleared");
      }, 7000); // Extended to 7 seconds
      
      // Clear local state after longer delay
      setTimeout(() => {
        setLocalState(null);
        console.log("🧹 handleToggle: Local state cleared");
      }, 12000); // 12 seconds delay
    }
  };

  // Updated: Navigate to checkout instead of ending session
  const handleEndSession = async () => {
    if (!session?.id || isLoading) return;

    setIsLoading(true);
    setEndSessionButtonText("Calculating amount...");
    console.log("handleEndSession: Setting isLoading to true");
    try {
      const amountResponse = await getAmount(session.id);
      const amount = amountResponse.amount;
      setCalculatedAmount(amount);

      if (amount < MIN_AMOUNT) {
        setShowMinAmountPopup(true);
        setIsLoading(false);
        setEndSessionButtonText("End Session");
      } else {
        // Navigate to checkout instead of calling end API
        router.push(`/session/${session.id}/checkout`);
      }
    } catch (error) {
      console.error("Error getting session amount:", error);
      setEndSessionButtonText("End Session"); // Reset button text on error
      setIsLoading(false);
    }
  };

  // Updated: Navigate to checkout after user confirms
  const handleConfirmEndSession = async () => {
    setShowMinAmountPopup(false);
    if (!session?.id) return;

    // Navigate to checkout instead of calling end API
    router.push(`/session/${session.id}/checkout`);
  };

  const handleCloseMinAmountPopup = () => {
    setShowMinAmountPopup(false);
    setEndSessionButtonText("End Session"); // Reset button text if user cancels
    setIsLoading(false);
  };

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }
    };
  }, []);

  const strokeWidth = 12;
  const radius = 130 - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;

  const arcLength = circumference * 0.15;
  const dashArray = `${arcLength} ${circumference}`;

  const fakeMaxTime = 60;

  // Use current time based on pause state for smooth animation
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
          cursor: isLoading ? "not-allowed" : "pointer", // Disable cursor when loading
          opacity: isLoading ? 0.7 : 1, // Reduce opacity when loading
          alignSelf: "flex-end",
          mb: 2,
        }}
      >
        {/* Inner Box for the toggle switch */}
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
            {!isPaused ? (
              <LockOpen fontSize="small" />
            ) : (
              <Lock fontSize="small" />
            )}
          </SvgIcon>
        </Box>
      </Box>

      {/* Status */}
      <Typography
        variant="h3"
        fontWeight={700}
        mb={2}
      >
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
          "@media (max-width:330px)": {
            width: 200,
            height: 200,
          },
          "@media (max-width:280px)": {
            width: 160,
            height: 160,
          },
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 260 260"
          style={{ transform: "rotate(-90deg)" }}
        >
          {/* Define gradient */}
          <defs>
            <linearGradient
              id="progressGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
              gradientUnits="objectBoundingBox"
            >
              <stop offset="10%" stopColor="#20A48C" stopOpacity="1" />
              <stop offset="75%" stopColor="#0C3E35" stopOpacity="1" />
              <stop offset="100%" stopColor="#20A48C" stopOpacity="1" />
            </linearGradient>
          </defs>

          {/* Full background circle color 20A48C */}
          <circle
            cx="130"
            cy="130"
            r={radius}
            stroke="#20A48C"
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          {/* Animated progress arc with gradient */}
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
              // Only apply transition when rendered once
              transition: hasRenderedOnce ? "transform 0.5s ease-out" : "none",
              transform: `rotate(${rotation}deg)`,
              transformOrigin: "center",
            }}
          />
        </svg>

        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          <Typography
            variant="h4"
            fontWeight={700}
            sx={{
              fontSize: { xs: "36px", sm: "60px" }, // responsive font size
            }}
          >
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
            {"Stay focused"}
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
            {"Free 5-minute break after 50 minutes!"}
          </Typography>
        </Box>
      </Box>
      <Typography
        variant="h5"
        sx={{
          fontFamily: rootStyle.mainFontFamily,
          mb: 2,
        }}
      >
        {isPaused ? "Pod Locked" : "Pod Unlocked"}
      </Typography>

      <Button
        variant="contained"
        fullWidth
        onClick={handleToggle}
        sx={{ 
          mb: 4, 
          fontWeight: 600, 
          fontSize: 16,
          opacity: isThrottled ? 0.6 : 1,
          cursor: isThrottled ? 'not-allowed' : 'pointer'
        }}
        startIcon={!isPaused ? <Pause /> : <Play />}
        disabled={isLoading || isThrottled}
      >
        {isThrottled 
          ? "Please wait..." 
          : (!isPaused ? "Pause Session" : "Resume Session")
        }
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
              "@media (max-width:330px)": {
                width: "calc(100% - 10pt)",
                margin: "10pt",
              },
              "@media (max-width:300px)": {
                width: "calc(100% - 5pt)",
                margin: "5pt",
              },
              "@media (max-width:280px)": {
                width: "100%",
                margin: "2pt",
              },
            },
          },
        }}
      >
        <DialogTitle
          sx={{ textAlign: "center" }}
        >
          {"Minimum Amount Required"}
        </DialogTitle>
        <DialogContent sx={{ pb: 0, textAlign: "center" }}>
          <DialogContentText
            sx={{ fontSize: 16, color: rootStyle.descriptionColor, mb: 2 }}
          >
            {`The minimum amount to pay is ${MIN_AMOUNT.toLocaleString(
              "en-US",
              LOCAL_CURRENCY_CONFIG
            )}. Your current calculated amount is ${calculatedAmount.toLocaleString(
              "en-US",
              LOCAL_CURRENCY_CONFIG
            )}. Do you still want to end the session?`}
          </DialogContentText>
        </DialogContent>
        <DialogActions
          sx={{
            justifyContent: "center",
            gap: 3,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: "center ",
            margin: 0,
            "@media (max-width:330px)": {
              "& .MuiButton-root": {
                padding: "6px 12px", // Smaller padding for buttons
              },
            },
          }}
          disableSpacing={true}
        >
          <Button
            onClick={handleCloseMinAmountPopup}
            disabled={isLoading}
            variant="outlined"
            size="small"
            sx={{
              py: { xs: 1, sm: 0.5 },
              textTransform: 'none',
              margin: 0,
            }}
          >
            Keep session
          </Button>
          <Button
            onClick={handleConfirmEndSession}
            color="error"
            disabled={isLoading}
            variant="contained"
            size="small"
            sx={{
              py: { xs: 1, sm: 0.5 },
              textTransform: 'none',
              margin: 0,
            }}
          >
            End anyway
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default SessionClock;