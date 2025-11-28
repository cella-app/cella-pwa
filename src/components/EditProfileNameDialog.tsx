'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
} from "@mui/material";
import { rootStyle } from '@/theme';

interface EditProfileNameDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  firstName: string;
  lastName: string;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  loading: boolean;
}

export default function EditProfileNameDialog({
  open,
  onClose,
  onConfirm,
  firstName,
  lastName,
  onFirstNameChange,
  onLastNameChange,
  loading,
}: EditProfileNameDialogProps) {
  const handleCancel = () => {
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            p: { xs: 0, sm: 2 },
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
        Update Name
      </DialogTitle>
      <DialogContent
        sx={{
          paddingTop: "2rem !important",
          paddingX: { xs: 2 },
        }}
      >
        <Stack spacing={2} direction="column" alignItems="center" width="100%">
          <TextField
            size="medium"
            variant="outlined"
            label="First Name"
            value={firstName}
            onChange={(e) => onFirstNameChange(e.target.value)}
            fullWidth
            slotProps={{
              input: {
                style: { fontSize: 18 },
              },
            }}
            autoFocus
            sx={{ minWidth: { xs: "100%", lg: 125 } }}
          />
          <TextField
            size="medium"
            variant="outlined"
            label="Last Name"
            value={lastName}
            onChange={(e) => onLastNameChange(e.target.value)}
            fullWidth
            slotProps={{
              input: {
                style: { fontSize: 18 },
              },
            }}
            sx={{ minWidth: { xs: "100%", lg: 125 } }}
          />
        </Stack>
      </DialogContent>
      <DialogActions
        sx={{
          justifyContent: "center",
          gap: 2,
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: "center",
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
          variant="outlined"
          onClick={handleCancel}
          disabled={loading}
          size="small"
          sx={{ py: { xs: 1, sm: 0.5 }, textTransform: 'none', margin: 0 }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onConfirm}
          disabled={loading}
          size="small"
          sx={{ py: { xs: 1, sm: 0.5 }, textTransform: 'none', margin: 0 }}
        >
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
