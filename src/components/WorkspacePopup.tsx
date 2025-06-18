"use client";

import { useEffect, useState } from 'react';
import { Box, Typography, Button, Chip } from '@mui/material';
import { styled } from '@mui/material/styles';
import WifiIcon from '@/components/icons/WifiIcon';
import ElectricIcon from '@/components/icons/ElectricIcon';
import FanIcon from '@/components/icons/FanIcon';
import theme, { rootStyle } from '@/theme';
import Image from 'next/image';
import { PodStatus, AccompanyingService, Pod } from '@/shared/data/models/Pod';
import { getPodDetail } from '@/features/pods/pods.action';

const PopupContainer = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  borderRadius: "12px",
  padding: theme.spacing(2),
  maxWidth: '400px',
  boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
  minWidth: "308px",
}));

const PopupHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  marginBottom: "0",
}));

const StatusChip = styled(Chip)(({ theme }) => ({
  '&.available': {
    backgroundColor: theme.palette.success.main,
    color: theme.palette.success.contrastText,
  },
  '&.unavailable': {
    backgroundColor: theme.palette.error.main,
    color: theme.palette.error.contrastText,
  },
  '&.closed': {
    backgroundColor: theme.palette.grey[500],
    color: theme.palette.grey[100],
  },
}));

const PriceServicesRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

const PriceBox = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.grey[100],
  borderRadius: '20px',
  padding: `${theme.spacing(1)} ${theme.spacing(2)}`,
  display: 'inline-block',
}));

const ServicesContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  alignItems: 'center',
}));

const ServiceIconBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 40,
  height: 40,
  borderRadius: '50%',
  backgroundColor: theme.palette.grey[100],
}));

interface WorkspacePopupProps {
  id: string;
  name: string;
  status: PodStatus;
  distance: string;
  accompanying_services: AccompanyingService[],
}

const serviceIcons: Record<string, React.ComponentType<{ width: string; height: string; fill: string }>> = {
  wifi: WifiIcon,
  electric: ElectricIcon,
  fan: FanIcon,
};

export default function WorkspacePopup({
  id,
  name,
  distance,
  accompanying_services,
}: WorkspacePopupProps) {
  const [price, setPrice] = useState<number | null>(null);
  const [status, setStatus] = useState<PodStatus>();
  const [loading, setLoading] = useState<boolean>(true);

  const isAvailable = status === 'available';

  useEffect(() => {
    getPodDetail(id)
      .then((pod: Pod) => {
        setPrice(pod.price_on_min);
        setStatus(pod.status);
      })
      .catch((err) => {
        console.error("getPodDetail error", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  console.log(distance)

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
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48 }}>
          <Image src="/icon_pod.png" alt="Pod icon" width={60} height={60} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" component="h4" sx={{
            fontFamily: rootStyle.titleFontFamily,
            fontSize: "20px",
            fontWeight: 700,
            marginBottom: 0.5
          }}>
            {name}
          </Typography>
        </Box>
      </PopupHeader>

      <Box sx={{ marginLeft: '64px', marginBottom: 2 }}>
        <StatusChip
          label={getStatusLabel(status || PodStatus.unavailable)}
          size="small"
          className={status}
        />
      </Box>

      <PriceServicesRow>
        <PriceBox>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {loading ? 'Loading price...' : `${price ?? 'N/A'}€/min`}
          </Typography>
        </PriceBox>

        <ServicesContainer>
          {accompanying_services.map((service) => {
            const Icon = serviceIcons[service.icon_key?.toLowerCase()];
            if (!Icon) return null;

            return (
              <ServiceIconBox key={service.id}>
                <Icon width="20" height="20" fill="#4a5568" />
              </ServiceIconBox>
            );
          })}
        </ServicesContainer>
      </PriceServicesRow>

      <Button
        variant="contained"
        fullWidth
        disabled={!isAvailable}
        sx={{
          backgroundColor: isAvailable ? theme.palette.primary.main : 'grey.500',
          color: 'white',
          borderRadius: '12px',
          py: 1.5,
          fontWeight: 600,
          '&:hover': {
            backgroundColor: isAvailable ? '#1b5e20' : 'grey.600',
          },
        }}
      >
        {isAvailable ? 'Reserve Now' : 'View Details'}
      </Button>
    </PopupContainer>
  );
}
