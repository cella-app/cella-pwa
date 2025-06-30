/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
} from "@mui/material";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { rootStyle } from "@/theme";
import { useParams, useRouter } from 'next/navigation';
import { useSessionStore } from '@/features/reservation/stores/session.store';
import { useEffect, useState } from 'react';
import { sessionApi } from '@/shared/api/session.api';
import { Session, SessionStatusEnum } from "@/shared/data/models/Session";

const checklistItems = [
  {
    key: 'belongings',
    label: 'Take your belongings',
    icon: '💼',
  },
  {
    key: 'clean',
    label: 'Leave the pod clean',
    icon: '🧹',
  },
  {
    key: 'ventilation',
    label: 'Switch off ventilation',
    icon: '🌬️',
  },
  {
    key: 'door',
    label: 'Close the door fully',
    icon: '🚪',
  },
];

export default function SessionCheckoutPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const router = useRouter();
  // const { current: currentSession, checkSession } = useSessionStore();
  // const [sessionDetails, setSessionDetails] = useState<Session | null>(null);
  // const [isLoading, setIsLoading] = useState(true);

  // useEffect(() => {
  //   checkSession();
  // }, [checkSession]);

  // useEffect(() => {
  //   sessionApi.getSessionById(sessionId)
  //     .then((session) => {
  //       setSessionDetails(session);
  //     })
  //     .catch(() => {
  //       router.push('/not-found');
  //     })
  //     .finally(() => {
  //       setIsLoading(false);
  //     });
  // }, [sessionId, router]);

  const [checked, setChecked] = useState<{ [key: string]: boolean }>({
    belongings: false,
    clean: false,
    ventilation: false,
    door: false,
  });

  const allChecked = checklistItems.every(item => checked[item.key]);

  const handleToggle = (key: string) => {
    setChecked(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const checkoutClick = () => {
    if (allChecked) {
      router.push(`/session/${sessionId}/complete`)
    }
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      backgroundColor: '#FCFCF6',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      py: 4,
      px: 2,
    }}>
      <Card sx={{
        maxWidth: 400,
        width: '100%',
        borderRadius: 3,
        boxShadow: 'none',
        border: 'none',
        background: 'transparent',
      }}>
        <CardContent sx={{ p: 0 }}>
          <Typography variant="h4" fontWeight={700} mb={4} sx={{
            textAlign: 'center',
            fontSize: "36px",
            fontFamily: rootStyle.titleFontFamily
          }}>
            Checkout
          </Typography>
          <Typography sx={{
            textAlign: 'center',
            fontSize: "20px",
            fontWeight: 600,
            mb: 4,
          }}>
            Before you go, please make<br />sure everything is in place.
          </Typography>

          <Box sx={{ mb: 8 }}>
            {checklistItems.map(item => (
              <Box key={item.key} sx={{
                display: 'flex',
                alignItems: 'center',
                mb: 4,
                fontWeight: 700,
                fontSize: '1.25rem',
                color: '#222',
              }}>
                <span style={{ fontSize: "24px", marginRight: 12 }}>{item.icon}</span>
                <Typography
                  component="span"
                  sx={{ fontWeight: 700, flex: 1, fontSize: "24px", fontFamily: rootStyle.titleFontFamily }}
                >
                  {item.label}
                </Typography>
                <span
                  style={{ cursor: 'pointer', width: "26px", height: "26px" }}
                  onClick={() => handleToggle(item.key)}
                >
                  {checked[item.key]
                    ? <CheckCircleIcon sx={{ color: '#185C3C' }} />
                    : <RadioButtonUncheckedIcon sx={{ color: '#BDBDBD' }} />}
                </span>
              </Box>
            ))}
          </Box>

          <Button
            variant={!allChecked ? "outlined" : "contained"}
            fullWidth
            disabled={!allChecked}
            onClick={checkoutClick}
            sx={{
              pointerEvents: allChecked ? 'auto' : 'none',
            }}
          >
            {"I'm done — Lock Pod & Finish"}
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
