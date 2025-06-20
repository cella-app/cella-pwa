"use client";

import { useEffect, useState } from 'react';
import { Box, Typography, Button} from '@mui/material';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
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
  marginBottom: "50px",
  border: `1px solid ${rootStyle.borderColorMain}` ,
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
        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
          <Box sx={{ width: 80, height: 80, mr: 2 }}>
            <Image rel="preload" src="/icon_pod.png" alt="Pod icon" width={80} height={80} />
          </Box>

          <Box sx={{ flex: 1 }}>
            {/* Tiêu đề */}
            <Typography
              variant="h6"
              component="h4"
              sx={{
                fontFamily: rootStyle.titleFontFamily,
                fontSize: "24px",
                fontWeight: 700,
              }}
            >
              {name}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TimelineSeparator sx={{ display: 'flex', alignItems: 'center' }}>
                <TimelineDot sx={{
                  backgroundColor: theme.palette.primary.main
                }} />
              </TimelineSeparator>

              <TimelineContent
                sx={{
                  ml: 1,
                  fontSize: "20px",
                  fontWeight: 700,
                }}
              >
                {getStatusLabel(status || PodStatus.unavailable)}
              </TimelineContent>
            </Box>
          </Box>
        </Box>
      </PopupHeader>

      <PriceServicesRow>
        <PriceBox>
          <Typography variant="body1" sx={{ fontWeight: 600, margin: "-2px" }}>
            {loading ? 'Loading price...' : `${price ?? 'N/A'}€/min`}
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
      <ButtonBox>
        <Button
          variant="contained"
          fullWidth
          disabled={!isAvailable}
          sx={{
            backgroundColor: isAvailable ? theme.palette.primary.main : 'grey.500',
            maxWidth: "200px",
            color: 'white',
            py: 1.5,
            fontWeight: 600,
            '&:hover': {
              backgroundColor: isAvailable ? '#1b5e20' : 'grey.600',
            },
          }}
        >
          {isAvailable ? 'Reserve Now' : 'View Details'}
        </Button>
      </ButtonBox>
    </PopupContainer>
  );
}
