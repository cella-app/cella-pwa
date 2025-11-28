'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Stack,
  Typography,
} from "@mui/material";
import { rootStyle } from '@/theme';
import { PaymentMethod } from '@/shared/data/models/Payment';
import { getPaymentMethodIcon, getPaymentMethodLabel } from '@/shared/utils/payment';

interface SelectDefaultPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  paymentMethods: PaymentMethod[];
  selectedPaymentMethodId: string | null;
  defaultPaymentMethodId: string | null;
  loading: boolean;
  onPaymentMethodSelect: (paymentMethodId: string) => void;
}

export default function SelectDefaultPaymentDialog({
  open,
  onClose,
  onConfirm,
  paymentMethods,
  selectedPaymentMethodId,
  defaultPaymentMethodId,
  loading,
  onPaymentMethodSelect,
}: SelectDefaultPaymentDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: {
          sx: {
            p: { xs: 1, sm: 2 },
            background: rootStyle.backgroundColor,
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: 700,
          fontSize: 24,
          pb: 0,
          textAlign: 'center',
        }}
      >
        Select Default Payment
      </DialogTitle>
      <DialogContent sx={{ paddingTop: "2rem !important", paddingX: { xs: 2 } }}>
        <Stack spacing={1.5} direction="column" width="100%">
          {paymentMethods.map((pm) => (
            <Box
              key={pm.id}
              onClick={() => onPaymentMethodSelect(pm.id)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                padding: 2,
                border: `2px solid ${selectedPaymentMethodId === pm.id ? rootStyle.elementColor : rootStyle.borderColorMain}`,
                borderRadius: 2,
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                backgroundColor: selectedPaymentMethodId === pm.id ? 'rgba(12, 62, 46, 0.08)' : 'transparent',
                '&:hover': {
                  borderColor: rootStyle.elementColor,
                  backgroundColor: 'rgba(12, 62, 46, 0.04)',
                  boxShadow: '0 2px 8px rgba(12, 62, 46, 0.1)',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                {getPaymentMethodIcon(pm, 28)}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body1" fontWeight={700} sx={{ color: rootStyle.textColor }}>
                  {getPaymentMethodLabel(pm)}
                </Typography>
                {pm.type === 'card' && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: rootStyle.descriptionColor,
                      fontSize: '0.85rem',
                      display: 'block',
                      mt: 0.25,
                    }}
                  >
                    Expires {pm.exp_month}/{pm.exp_year}
                  </Typography>
                )}
              </Box>
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  border: `2px solid ${selectedPaymentMethodId === pm.id ? rootStyle.elementColor : rootStyle.borderColorMain}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: selectedPaymentMethodId === pm.id ? rootStyle.elementColor : 'transparent',
                  transition: 'all 0.2s ease-in-out',
                  flexShrink: 0,
                }}
              >
                {selectedPaymentMethodId === pm.id && (
                  <Typography sx={{ color: 'white', fontSize: 18, fontWeight: 700, lineHeight: 1 }}>✓</Typography>
                )}
              </Box>
            </Box>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions
        sx={{
          justifyContent: 'center',
          gap: 2,
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: 'center',
          margin: 0,
          "@media (max-width:330px)": {
            "& .MuiButton-root": {
              padding: "6px 12px",
            },
          },
        }}
        disableSpacing={true}
      >
        <Button
          onClick={onClose}
          disabled={loading}
          variant="outlined"
          size="small"
          sx={{ py: { xs: 1, sm: 0.5 }, textTransform: 'none', margin: 0 }}
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading || !selectedPaymentMethodId || selectedPaymentMethodId === defaultPaymentMethodId}
          variant="contained"
          size="small"
          sx={{ py: { xs: 1, sm: 0.5 }, textTransform: 'none', margin: 0 }}
        >
          {loading ? 'Setting...' : 'Set Default'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
