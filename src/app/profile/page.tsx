"use client";
import { useEffect, useState, useRef } from "react";
import { setUser as setUserStorage } from "@/shared/utils/auth";
import { useRouter } from "next/navigation";
import { User } from "@/shared/data/models/User";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Avatar,
  IconButton,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LogoutIcon from '@mui/icons-material/Logout';
import { rootStyle } from '@/theme';
import { logOutAction } from "@/features/auth/auth.action"
import { paymentApi } from '@/shared/api/payment.api';
import { PaymentMethod } from '@/shared/data/models/Payment';
import { meApi } from '@/shared/api/me.api';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { updateAvatarWithDelete, getMe, updateInfo } from '@/features/me/me.action';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import { Skeleton } from '@mui/material';

type UserWithAvatarUrl = User & { avatar_url?: string };

export default function ProfilePage() {
  const [user, setUser] = useState<UserWithAvatarUrl | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [editNameDialogOpen, setEditNameDialogOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const freshUser = await getMe();
        setUserStorage(freshUser);
        setUser(freshUser);
        setFirstName(freshUser.first_name || '');
        setLastName(freshUser.last_name || '');
      } catch {
        // handle error if needed
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
    paymentApi.getPaymentMethod().then((data) => {
      if (Array.isArray(data)) {
        setPaymentMethods(data);
      } else if (data) {
        setPaymentMethods([data]);
      }
    }).catch(() => setPaymentMethods([]));
  }, []);

  const handleDeleteAccount = async () => {
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await meApi.delete();
      await logOutAction(router);
    } catch (err) {
      console.error(err)
      setDeleting(false);
      alert('Failed to delete account. Please try again.');
    }
  };

  const handleCancelDelete = () => setDeleteDialogOpen(false);

  const handleLogOut = async () => {
    await logOutAction(router)
  }

  const handleEdit = () => {
    router.push('/payment/add-to-card?frm=/profile')
    router.push('/payment/add-to-card?frm=/profile')
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setAvatarLoading(true);
    try {
      const updatedUser = await updateAvatarWithDelete(user, file);
      setUser(updatedUser);
    } catch {
      alert('Failed to update avatar.');
    } finally {
      setAvatarLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 4,
        position: 'relative',
      }}
    >
      {/* Nút Back trên góc trái, không background */}
      <IconButton
        onClick={() => router.push('/workspace/discovery')}
        sx={{
          position: 'absolute',
          top: 24,
          left: 24,
          background: 'none',
          boxShadow: 'none',
          p: 1.5,
          minWidth: 44,
          minHeight: 44
        }}
        aria-label="Back to map"
      >
        <ArrowBackIcon />
      </IconButton>
      {/* Nút Logout trên góc phải */}
      <IconButton
        onClick={handleLogOut}
        sx={{
          position: 'absolute',
          top: 24,
          right: 24,
          background: 'none',
          boxShadow: 'none',
          p: 1.5,
          minWidth: 44,
          minHeight: 44
        }}
        aria-label="Logout"
      >
        <LogoutIcon />
      </IconButton>
    {loading ? <ProfilePageSkeleton/> : 
    <>
      <Box
        sx={{
          maxWidth: 500,
          borderRadius: 3,
          p: 4,
          textAlign: "center",
          position: 'relative',
        }}
      >
        <Typography variant="h4" fontWeight={700} mb={2} sx={{
          fontSize: "36px",
          fontFamily: rootStyle.titleFontFamily
        }}>
          Your Profile
        </Typography>
        <Box sx={{ position: "relative", display: "inline-block", mb: 1 }}>
          <Avatar
            alt="User Avatar"
            src={user?.avatar_url}
            sx={{ width: 72, height: 72, mx: "auto", fontSize: 36, bgcolor: "#E0E0E0", opacity: avatarLoading ? 0.5 : 1 }}
            onClick={handleAvatarClick}
          >
            {user?.avatar
              ? ""
              : user?.first_name
              ? user.first_name[0].toUpperCase()
              : user?.email[0].toUpperCase() }
            {avatarLoading && <span style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#888', background: 'rgba(255,255,255,0.5)' }}>Uploading...</span>}
          </Avatar>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleAvatarChange}
          />
          <Typography variant="caption" color="text.secondary" display="block" mt={1}>
            Tap to change photo
          </Typography>
        </Box>
        {/* Tên user: click để edit bằng Dialog */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexDirection: "row",
            borderRadius: 2,
            px: 2,
            py: 1,
            transition: 'background 0.2s',
          }}
          onClick={() => setEditNameDialogOpen(true)}
        >
          <Typography variant="h6" fontWeight={600} sx={{
            fontFamily: rootStyle.titleFontFamily,
            fontSize: "24px"
          }}>
            {user?.first_name || user?.last_name ? user?.first_name + " " + user?.last_name : "Unknown"}
          </Typography>
          <EditIcon fontSize="small" sx={{ ml: 1, color: '#888' }} />
        </Box>
        <Typography variant="body2" color="text.secondary" mb={2} fontWeight={600} fontSize="20px">
          {user?.email}
        </Typography>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
            mb: 2,
          }}
        >
          <CreditCardIcon fontSize="small" />
          {paymentMethods.length > 0 ? paymentMethods.map(pm => (
            <Typography key={pm.pm_id} variant="body2">
              {pm.type} •••• {pm.last4} (exp: {pm.exp_month}/{pm.exp_year})
            </Typography>
          )) : (
            <Typography variant="body2" color="text.secondary">
              No card added yet.
            </Typography>
          )}
          <IconButton onClick={handleEdit} sx={{ p: 1.5, minWidth: 44, minHeight: 44 }}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Box>
        <Card
          sx={{
            border:  `1px solid ${rootStyle.borderColorMain}`,
            boxShadow: "none",
            mb: 2,
            background: "transparent",
          }}
        >
          <CardContent>
            <Typography fontWeight={600} mb={1}>
              Delete My Account
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              This will permanently delete your account and all session data. {"You'll"} be logged out immediately.
            </Typography>
            <Button
              variant="contained"
              color="error"
              fullWidth
              onClick={handleDeleteAccount}
              sx={{
                maxWidth: "247px !important"
              }}
            >
              Delete Account
            </Button>
          </CardContent>
        </Card>
      </Box>
      <Dialog open={deleteDialogOpen} onClose={handleCancelDelete} fullWidth maxWidth="xs" slotProps={{paper:{sx: { borderRadius: 3, p: { xs: 1, sm: 2 }, background: rootStyle.backgroundColor }}}}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 24, pb: 0, textAlign: 'center' }}>Are you sure?</DialogTitle>
        <DialogContent sx={{ pb: 0, textAlign: 'center' }}>
          <Typography sx={{ fontSize: 16, color: rootStyle.descriptionColor, mb: 2 }}>This action is permanent.</Typography>
        </DialogContent>
        <DialogActions
          sx={{
            justifyContent: 'center',
            gap: 2,
            pb: { xs: 1.5, sm: 2 },
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Button
            onClick={handleCancelDelete}
            disabled={deleting}
            variant="outlined"
            fullWidth
            sx={{
              borderRadius: 3,
              fontWeight: 700,
              color: rootStyle.elementColor,
              borderColor: rootStyle.elementColor,
              px: 2,
              background: 'transparent',
              maxWidth: 180,
              minWidth: 125
            }}
          >
            Keep session
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            disabled={deleting}
            variant="contained"
            fullWidth
            sx={{
              borderRadius: 3,
              fontWeight: 700,
              px: 2,
              background: '#C2412B',
              maxWidth: 180,
              minWidth: 125
            }}
          >
            {deleting ? 'Deleting...' : 'Yes, Delete'}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={editNameDialogOpen} onClose={() => setEditNameDialogOpen(false)} maxWidth="xs" fullWidth slotProps={{paper: {sx: { borderRadius: 3, p: { xs: 0, sm: 2 }, background: rootStyle.backgroundColor }}}}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 24, pb: 0, textAlign: 'center' }}>Update Name</DialogTitle>
        <DialogContent sx={{ paddingTop: "2rem !important", paddingX:{xs:2} }}>
          <Stack spacing={2} direction="column" alignItems="center" width="100%">
            <TextField
              size="medium"
              variant="outlined"
              label="First Name"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              fullWidth
              slotProps={{
                input: {
                  style: { fontSize: 18 }
                }
              }}
              autoFocus
              sx={{minWidth:{xs:"100%", lg:125},}}
            />
            <TextField
              size="medium"
              variant="outlined"
              label="Last Name"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              fullWidth
              slotProps={{
                input: {
                  style: { fontSize: 18 }
                }
              }}
              sx={{minWidth:{xs:"100%", lg:125},}}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{
            justifyContent: "center",
            gap: 2,
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: "center",
            // overflow: "hidden",
          }}
          disableSpacing={true}>
          <Button
            variant="contained"
            color="primary"
            onClick={async () => {
              if (!user) return;
              setSavingName(true);
              try {
                const updated = await updateInfo(user, firstName, lastName);
                setUser(updated);
                setEditNameDialogOpen(false);
              } catch {
                // alert handled by alertStore
              } finally {
                setSavingName(false);
              }
            }}
            disabled={savingName}
            sx={{ flex: 1,
                  maxWidth: 180,
                  minWidth: {xs:"100%", md:125},
                  fontWeight: 700 }}
          >
            Save
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => {
              setEditNameDialogOpen(false);
              setFirstName(user?.first_name || '');
              setLastName(user?.last_name || '');
            }}
            sx={{ flex: 1,
                  maxWidth: 180,
                  minWidth: {xs:"100%", md:125},
                  fontWeight: 700 }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </>}
    </Box>
  );
} 

function ProfilePageSkeleton() {
  return (
      <Box
        sx={{
          maxWidth: 500,
          borderRadius: 3,
          p: 4,
          textAlign: "center",
          position: 'relative',
        }}
      >
        <Typography variant="h4" fontWeight={700} mb={2} sx={{
          fontSize: "36px",
          fontFamily: rootStyle.titleFontFamily
        }}>
          <Skeleton variant="text" width={200} sx={{ margin: 'auto' }} />
        </Typography>
        <Box sx={{ position: "relative", display: "inline-block", mb: 1 }}>
          <Skeleton variant="circular" width={72} height={72} sx={{ margin: 'auto' }} />
          <Typography variant="caption" color="text.secondary" display="block" mt={1}>
            <Skeleton variant="text" width={120} />
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexDirection: "row",
            borderRadius: 2,
            px: 2,
            py: 1,
            transition: 'background 0.2s',
          }}
        >
          <Typography variant="h6" fontWeight={600} sx={{
            fontFamily: rootStyle.titleFontFamily,
            fontSize: "24px"
          }}>
            <Skeleton variant="text" width={150} />
          </Typography>
          <EditIcon fontSize="small" sx={{ ml: 1, color: '#888' }} />
        </Box>
        <Typography variant="body2" color="text.secondary" mb={2} fontWeight={600} fontSize="20px">
          <Skeleton variant="text" width={250} sx={{ margin: 'auto' }} />
        </Typography>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
            mb: 2,
          }}
        >
          <CreditCardIcon fontSize="small" />
          <Typography variant="body2">
            <Skeleton variant="text" width={200} />
          </Typography>
          <IconButton sx={{ p: 1.5, minWidth: 44, minHeight: 44 }}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Box>
        <Card
          sx={{
            border: `1px solid ${rootStyle.borderColorMain}`,
            boxShadow: "none",
            mb: 2,
            background: "transparent",
          }}
        >
          <CardContent>
            <Typography fontWeight={600} mb={1}>
              <Skeleton variant="text" width={180} />
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              <Skeleton variant="text" width={300} />
              <Skeleton variant="text" width={280} />
            </Typography>
            <Skeleton variant="rectangular" width={247} height={36} sx={{ margin: 'auto' }} />
          </CardContent>
        </Card>
      </Box>
   
  )
}
