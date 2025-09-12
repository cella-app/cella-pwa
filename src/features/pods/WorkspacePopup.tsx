"use client";

import { useEffect, useState } from 'react';
import { Box, Typography, Button, Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';
import WifiIcon from '@/components/icons/WifiIcon';
import ElectricIcon from '@/components/icons/ElectricIcon';
import FanIcon from '@/components/icons/FanIcon';
import theme, { rootStyle } from '@/theme';
import Image from 'next/image';
import { PodStatus, AccompanyingService, Pod } from '@/shared/data/models/Pod';
import { getPodDetail } from '@/features/pods/pods.action';
import { reserveNow, unlockReserve, cancelReserve } from '@/features/reservation/reservation.action';
import { useReservationStore } from '@/features/reservation/stores/reservation.store';
import { useSessionStore } from '@/features/session/stores/session.store';
import { Reservation } from '@/shared/data/models/Reservation';
import { useRouter } from 'next/navigation';
import LocationOnIcon from '@mui/icons-material/LocationOn';

const PopupContainer = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  borderRadius: "12px",
  padding: theme.spacing(2),
  maxWidth: '400px',
  boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
  minWidth: "308px",
  marginBottom: "50px",
  border: `1px solid ${rootStyle.borderColorMain}`,
}));

const PopupHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  marginBottom: "0",
}));

const PriceServicesRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-around',
  alignItems: 'center',
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

const PriceBox = styled(Box)(({ theme }) => ({
  borderRadius: '20px',
  padding: `${theme.spacing(1)} ${theme.spacing(2)}`,
  display: 'inline-block',
  border: `1px solid`,
  borderColor: rootStyle.borderColorMain,
  height: 36,
}));

const ServicesContainer = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  borderRadius: '20px',
  border: `1px solid`,
  borderColor: rootStyle.borderColorMain,
  height: 36,
}));

const ServiceIconBox = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: `${theme.spacing(1)} ${theme.spacing(1)}`,
}));

const ButtonBox = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: `${theme.spacing(1)} ${theme.spacing(1)}`,
}));

interface WorkspacePopupProps {
  id: string;
  name: string;
  status: PodStatus;
  accompanying_services: AccompanyingService[];
  currentReservation?: Reservation | null;
}


const serviceIcons: Record<string, React.ComponentType<{ width: string; height: string; fill: string }>> = {
  wifi: WifiIcon,
  electric: ElectricIcon,
  fan: FanIcon,
};

export default function WorkspacePopup({
  id,
  name,
  accompanying_services,
}: WorkspacePopupProps) {
  const [price, setPrice] = useState<number | null>(null);
  const [status, setStatus] = useState<PodStatus>();
  const [address, setAddress] = useState<string | null>();
  const [loading, setLoading] = useState<boolean>(true);
  const [reserved, setReserved] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isLoading, setIsLoading] = useState(false); // Added isLoading state
  const router = useRouter();

  const { current: currentReservation, setReservation, clearReservation } = useReservationStore();
  const { setSession } = useSessionStore();
  const isAvailable = status === 'available';
  // Countdown calculation
  const getCountdownFromReservation = (unlock_due: string | Date): number => {
    const due = new Date(unlock_due).getTime();
    const now = Date.now();
    const diff = due - now;
    return diff > 0 ? Math.floor(diff / 1000) : 0;
  };

  // Get Pod Detail
  useEffect(() => {
    setLoading(true);
    getPodDetail(id)
      .then((pod: Pod) => {
        setPrice(pod.price_on_min);
        setStatus(pod.status);
        setAddress(pod.address)
      })
      .catch((err) => {
        console.error("getPodDetail error", err);
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Load from reservation store if matching pod
  useEffect(() => {
    if (currentReservation?.workspace_pod === id) {
      const seconds = getCountdownFromReservation(currentReservation.unlock_due);
      if (seconds > 0) {
        setReserved(true);
        setCountdown(seconds);
      } else {
        clearReservation();
        setReserved(false);
        setCountdown(0);
        setStatus(PodStatus.available);
      }
    }
  }, [currentReservation, id]);

  // Countdown timer
  useEffect(() => {
    if (!reserved || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          // Auto cancel when time expires
          if (currentReservation?.id) {
            cancelReserve(currentReservation.id).catch((err) => {
              console.error('Auto cancel failed:', err);
            });
          }
          setReserved(false);
          clearReservation();
          setStatus(PodStatus.available);
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [reserved, countdown, currentReservation]);

  // Action: Reserve
  const reserveNowClick = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const reservation = await reserveNow(id);
      setReservation(reservation);
      const seconds = getCountdownFromReservation(reservation.unlock_due);
      if (seconds > 0) {
        setReserved(true);
        setCountdown(seconds);
      } else {
        clearReservation();
        setReserved(false);
        setCountdown(0);
        setStatus(PodStatus.available);
      }
    } catch (err) {
      console.error('Reserve failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Action: Unlock
  const unlockClick = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      if (!currentReservation?.id) throw new Error('No reservation to unlock');
      const session = await unlockReserve(currentReservation.id);
      setSession(session);
      clearReservation();
      setReserved(false);
      setCountdown(0);
      setTimeout(() => {
        router.push(`/session/${session.id}/progress`);
      });
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      if ("user no payment method" == err.message ) {
        router.push(`/payment/add-to-card?frm=/workspace/discovery?opw=${id}`);
      }
      console.error('Unlock failed:', err);
      setIsLoading(false);
    }
  };

  // Action: Cancel
  const cancelClick = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      if (!currentReservation?.id) throw new Error('No reservation to cancel');
      await cancelReserve(currentReservation.id);
      clearReservation();
      setReserved(false);
      setCountdown(0);
      setStatus(PodStatus.available);
    } catch (err) {
      console.error('Cancel failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusLabel = (currentStatus: PodStatus) => {
    switch (currentStatus) {
      case 'available': return 'Available';
      case 'unavailable': return 'Unavailable';
      default: return '';
    }
  };

  return (
    <PopupContainer>
      <PopupHeader>
        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
          <Box sx={{ width: 80, height: 80, mr: 2 }}>
            <Image rel="preload" src="/icon_pod.png" alt="Pod icon" width={80} height={80} />
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" component="h4" sx={{
              fontFamily: rootStyle.titleFontFamily,
              fontSize: "24px",
              fontWeight: 700,
            }}>
              {name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1}}>
              <LocationOnIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
              <Typography variant="h6" component="h4" sx={{
                fontSize: "16px",
                fontWeight: 300,
              }}>
                {address}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {reserved ? (
                <Typography sx={{ ml: 1, fontSize: "20px", fontWeight: 700 }}>
                  {`${String(Math.floor(countdown / 60)).padStart(2, '0')}:${String(countdown % 60).padStart(2, '0')} time left`}
                </Typography>
              ) : (
                <>
                  <span style={{
                    display: 'inline-block',
                    width: 10,
                    height: 10,
                    backgroundColor: rootStyle.elementColor,
                    borderRadius: '50%',
                    marginRight: 15,
                    marginLeft: 5,
                    verticalAlign: 'middle',
                  }} />
                  <Typography sx={{ fontSize: "20px", fontWeight: 700 }}>
                    {getStatusLabel(status || PodStatus.unavailable)}
                  </Typography>
                </>
              )}
            </Box>
          </Box>
        </Box>
      </PopupHeader>

      <PriceServicesRow>
        <PriceBox>
          <Typography variant="body1" sx={{ fontWeight: 600, margin: "-2px" }}>
          {loading 
	            ? 'Loading price...' 
	            : price != null 
	            	? `${Number(price).toLocaleString('en-US', { 
	            			minimumFractionDigits: 2,
	            			maximumFractionDigits: 2
	            		})}€/min`
	            	: 'N/A€/min'
          }
          </Typography>
        </PriceBox>

        <ServicesContainer>
          {accompanying_services.map((service) => {
            const Icon = serviceIcons[service.icon_key?.toLowerCase()];
            if (!Icon) return null;

            return (
              <ServiceIconBox key={service.id}>
                <Icon width="24" height="24" fill="#4a5568" />
              </ServiceIconBox>
            );
          })}
        </ServicesContainer>
      </PriceServicesRow>
      <Tooltip
        title={
          !isAvailable
            ? 'Pod is unavailable'
            : currentReservation && currentReservation?.workspace_pod !== id
              ? 'You already reserved another workspace'
              : ''
        }
      ><span> 
      {!reserved && (
        <ButtonBox>
          <Button
            variant="contained"
            fullWidth
            disabled={
              !isAvailable ||
              (!!currentReservation && currentReservation.workspace_pod !== id) ||
              isLoading // Disable when loading
            }
            onClick={reserveNowClick}
            sx={{
              boxShadow: 'none',
              maxWidth: "200px",
              color: 'white',
              py: 1.5,
              fontWeight: 600,
              '&:hover': { boxShadow: 'none' },
            }}
          >
            Reserve Now
          </Button>
        </ButtonBox>
          )}
        </span>
      </Tooltip>

      {reserved && (
        <ButtonBox sx={{ display: 'flex', gap: 2, width: '100%' }}>
          <Button
            variant="contained"
            sx={{
              flex: 1,
              minWidth: 0,
              fontWeight: 600,
              borderRadius: '12px',
              boxShadow: 'none',
              '&:hover': { boxShadow: 'none' },
            }}
            onClick={unlockClick}
            disabled={isLoading} // Disable when loading
          >
            Unlock Pod
          </Button>
          <Button
            variant="outlined"
            sx={{
              flex: 1,
              minWidth: 0,
              fontWeight: 600,
              borderRadius: '12px',
              boxShadow: 'none',
              '&:hover': { boxShadow: 'none' },
            }}
            onClick={cancelClick}
            disabled={isLoading} // Disable when loading
          >
            Cancel
          </Button>
        </ButtonBox>
      )}
    </PopupContainer>
  );
}
