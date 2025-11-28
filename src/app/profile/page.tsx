"use client";
import { useEffect, useState, useRef, useMemo } from "react";
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
  Tooltip,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddCircleOutlineRoundedIcon from '@mui/icons-material/AddCircleOutlineRounded';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SwapVerticalCircleIcon from '@mui/icons-material/SwapVerticalCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import AppleIcon from '@mui/icons-material/Apple';
import GoogleIcon from '@mui/icons-material/Google';
import { rootStyle } from '@/theme';
import { logOutAction } from "@/features/auth/auth.action"
import { paymentApi } from '@/shared/api/payment.api';
import { PaymentMethod } from '@/shared/data/models/Payment';
import { meApi } from '@/shared/api/me.api';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import SelectDefaultPaymentDialog from '@/components/SelectDefaultPaymentDialog';
import EditProfileNameDialog from '@/components/EditProfileNameDialog';
import { updateAvatarWithDelete, getMe, updateInfo } from '@/features/me/me.action';
import { userAlertStore, SERVERIFY_ALERT } from '@/features/alert/stores/alert.store';
import { Skeleton } from '@mui/material';

type UserWithAvatarUrl = User & { avatar_url?: string };

// mock payment is an actual response from BE
const mockPayment:PaymentMethod = {
  "brand": "visa",
  "date_created": null,
  "date_updated": null,
  "detail": {
      "brand": "visa",
      "checks": {
          "address_line1_check": "pass",
          "address_postal_code_check": "pass",
          "cvc_check": null
      },
      "country": "US",
      "display_brand": "visa",
      "exp_month": 12,
      "exp_year": 2027,
      "fingerprint": "sEYcX0BemlmSwMaw",
      "funding": "credit",
      "generated_from": null,
      "last4": "4242",
      "networks": {
          "available": [
              "visa"
          ],
          "preferred": null
      },
      "regulated_status": "unregulated",
      "three_d_secure_usage": {
          "supported": true
      },
      "wallet": {
          "dynamic_last4": "4242",
          "google_pay": {},
          "type": "google_pay"
      }
  },
  "exp_month": 12,
  "exp_year": 2027,
  "id": "696931b9-8caf-41cc-b1a5-c9ffb249d250",
  "last4": "4242",
  "pm_id": "pm_1SQ41uP8gyJCOQi4dCs3xiDy",
  "type": "card",
  "user": "785d2d7c-990a-4cf2-9c3a-b2e43980ac67"
}

// Helper functions for payment method display
export const getPaymentMethodLabel = (pm: PaymentMethod): string => {
  const walletType = pm.detail?.wallet?.type;
  const isGooglePayCard = pm.type === 'card' && walletType === 'google_pay';
  const isApplePayCard = pm.type === 'card' && walletType === 'apple_pay';

  if (isGooglePayCard) {
    return `Google Pay (${pm.brand ? pm.brand.charAt(0).toUpperCase() + pm.brand.slice(1) : 'Visa'} •••• ${pm.last4})`;
  }
  if (isApplePayCard) {
    return `Apple Pay (${pm.brand ? pm.brand.charAt(0).toUpperCase() + pm.brand.slice(1) : 'Visa'} •••• ${pm.last4})`;
  }
  if (pm.type === 'apple_pay') return 'Apple Pay';
  if (pm.type === 'google_pay') return 'Google Pay';
  return `${pm.brand ? pm.brand.charAt(0).toUpperCase() + pm.brand.slice(1) : 'Card'} •••• ${pm.last4}`;
};

export const getPaymentMethodIcon = (pm: PaymentMethod, size: number = 28) => {
  const walletType = pm.detail?.wallet?.type;
  const isGooglePayCard = pm.type === 'card' && walletType === 'google_pay';
  const isApplePayCard = pm.type === 'card' && walletType === 'apple_pay';
  const iconProps = { fontSize: size, mr: size > 20 ? 2 : 1 };

  if (isGooglePayCard) return <GoogleIcon sx={{ ...iconProps, color: '#4285F4' }} />;
  if (isApplePayCard) return <AppleIcon sx={{ ...iconProps, color: rootStyle.textColor }} />;
  if (pm.type === 'apple_pay') return <AppleIcon sx={{ ...iconProps, color: rootStyle.textColor }} />;
  if (pm.type === 'google_pay') return <GoogleIcon sx={{ ...iconProps, color: '#4285F4' }} />;
  return <CreditCardIcon sx={{ ...iconProps, color: rootStyle.elementColor }} />;
};

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
  const { addAlert } = userAlertStore();
  const [savingName, setSavingName] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectDefaultDialogOpen, setSelectDefaultDialogOpen] = useState(false);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string | null>(null);
  const [settingDefault, setSettingDefault] = useState(false);
  const [defaultPaymentMethodId, setDefaultPaymentMethodId] = useState<string | null>(null);

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
      console.log("data", data);

      if (Array.isArray(data)) {
        setPaymentMethods(data);
        if (data.length > 0) {
          setDefaultPaymentMethodId(data[0].id);
          setSelectedPaymentMethodId(data[0].id);
        }
      } else if (data) {
        setPaymentMethods([data]);
        setDefaultPaymentMethodId(data.id);
        setSelectedPaymentMethodId(data.id);
      }
    }).catch(() => setPaymentMethods([]));
  }, []);

  const userDefaultPayment = useMemo(() => {
    if (!defaultPaymentMethodId) return null;
    return paymentMethods.find(pm => pm.id === defaultPaymentMethodId) || null;
  }, [paymentMethods, defaultPaymentMethodId]);

  const handleDeleteAccount =  () => {
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await meApi.delete();
      addAlert({
        severity: SERVERIFY_ALERT.SUCCESS,
        message: 'Account has been successfully deleted'
      });
      await logOutAction(router);
    } catch (err) {
      console.error(err)
      setDeleting(false);
      addAlert({
        severity: SERVERIFY_ALERT.ERROR,
        message: 'Failed to delete account. Please try again.'
      });
    }
  };

  const handleCancelDelete = () => setDeleteDialogOpen(false);

  const handleLogOut = async () => {
    await logOutAction(router)
  }

  const handleEdit = () => {
    router.push('/payment/add-to-card?frm=/profile')
  };
 
  const handleChangeDefault = () => {
    setSelectedPaymentMethodId(defaultPaymentMethodId);
    setSelectDefaultDialogOpen(true);
  };

  const mockSetDefaultPaymentMethod = async (paymentMethodId: string): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        setDefaultPaymentMethodId(paymentMethodId);
        resolve();
      }, 700);
    });
  };

  const handleConfirmSetDefault = async () => {
    if (!selectedPaymentMethodId) return;

    setSettingDefault(true);
    try {
      await mockSetDefaultPaymentMethod(selectedPaymentMethodId);
      setSelectDefaultDialogOpen(false);
      addAlert({
        severity: SERVERIFY_ALERT.SUCCESS,
        message: 'Default payment method updated successfully'
      });
    } catch (err) {
      console.error(err);
      addAlert({
        severity: SERVERIFY_ALERT.ERROR,
        message: 'Failed to update default payment method'
      });
    } finally {
      setSettingDefault(false);
    }
  };

  const handleCancelSelectDefault = () => {
    setSelectDefaultDialogOpen(false);
    setSelectedPaymentMethodId(defaultPaymentMethodId);
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
        position: 'relative',
        paddingTop: 0
      }}
    >
      <Box
        sx={{
          top: 0,
          mb: 2,
          width: '100%',
          display: "flex",
          flexDirection: "row",
          position: 'absolute',
          justifyContent: 'space-between',
        }}
      >    {/* Nút Back trên góc trái, không background */}
        <IconButton
          onClick={() => router.push('/workspace/discovery')}
          sx={{
            background: 'none',
            boxShadow: 'none',
          }}
          aria-label="Back to map"
        >
          <ArrowBackIcon sx={{
            fontSize: '22pt'
          }} />
        </IconButton>
        {/* Nút Logout trên góc phải */}
        <IconButton
          onClick={handleLogOut}
          sx={{
            background: 'none',
            boxShadow: 'none',
          }}
          aria-label="Logout"
        >
          <LogoutIcon sx={{
            fontSize: '22pt'
          }} />
        </IconButton>
      </Box>
      {loading ? <ProfilePageSkeleton /> :
        <>
          <Box
            sx={{
              maxWidth: 500,
              borderRadius: 3,
              py: 4,
              textAlign: "center",
              position: 'relative',
            }}
          >
            <Typography variant="h4" fontWeight={700} mb={2} sx={{
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
                    : user?.email[0].toUpperCase()}
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
                my: 4,
                flexWrap: "wrap",
              }}
            >
              {paymentMethods.length > 0 ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                  {paymentMethods.map(pm => (
                    <Box key={pm.id} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      {getPaymentMethodIcon(pm, 18)}
                      <Typography key={pm.pm_id} variant="body2">
                        {getPaymentMethodLabel(pm)} {pm.type === 'card' ? `(exp: ${pm.exp_month}/${pm.exp_year})` : ''}
                      </Typography>
                      {userDefaultPayment?.id === pm.id && <Tooltip title="Default payment">
                        <IconButton sx={{ py: 0, minHeight: 0, height: "fit-content", cursor: "default", ml: 'auto' }} disableFocusRipple disableRipple >
                          <CheckCircleIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>}
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No payment method added yet.
                </Typography>
              )}

              <Tooltip title="Add payment method">
                <IconButton onClick={handleEdit}>
                  <AddCircleOutlineRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              {paymentMethods.length > 0 && (
                <Tooltip title={userDefaultPayment?.id ? "Change default" : "Select default"}>
                  <IconButton onClick={handleChangeDefault}>
                    <SwapVerticalCircleIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            <Card
              sx={{
                border: `1px solid ${rootStyle.borderColorMain}`,
                boxShadow: "none",
                background: "transparent",
                maxWidth: 450,
                "@media (max-width:330px)": {
                  width: 300,
                },
                "@media (max-width:300px)": {
                  width: 280,
                },
                "@media (max-width:280px)": {
                  width: 250,
                },
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
                    maxWidth: "300px !important",
                    "@media (max-width:330px)": {
                      width: "180pt !important",
                    },
                    "@media (max-width:300px)": {
                      width: "160pt !important",
                    },
                    "@media (max-width:280px)": {
                      width: "140pt !important",
                    },
                  }}
                >
                  Delete Account
                </Button>
              </CardContent>
            </Card>
          </Box>
          <Dialog open={deleteDialogOpen} onClose={handleCancelDelete} fullWidth maxWidth="sm"
            slotProps={{
              paper:
              {
                sx: {
                  p: { xs: 1, sm: 2 },
                  background: rootStyle.backgroundColor,
                }
              }
            }}>
            <DialogTitle sx={{ fontWeight: 700, fontSize: 24, pb: 0, textAlign: 'center' }}>Are you sure?</DialogTitle>
            <DialogContent sx={{ pb: 0, textAlign: 'center' }}>
              <Typography sx={{ fontSize: 16, color: rootStyle.descriptionColor, mb: 2 }}>This action is permanent.</Typography>
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
                onClick={handleCancelDelete}
                disabled={deleting}
                variant="outlined"
                size="small"
                sx={{ py: { xs: 1, sm: 0.5 }, textTransform: 'none', margin: 0 }}
              >
                Keep session
              </Button>
              <Button
                onClick={handleConfirmDelete}
                color="error"
                disabled={deleting}
                variant="contained"
                size="small"
                sx={{ py: { xs: 1, sm: 0.5 }, textTransform: 'none', margin: 0, background: '#C2412B' }}
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </Button>
            </DialogActions>
          </Dialog>
          <EditProfileNameDialog
            open={editNameDialogOpen}
            onClose={() => {
              setEditNameDialogOpen(false);
              setFirstName(user?.first_name || '');
              setLastName(user?.last_name || '');
            }}
            onConfirm={async () => {
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
            firstName={firstName}
            lastName={lastName}
            onFirstNameChange={setFirstName}
            onLastNameChange={setLastName}
            loading={savingName}
          />
          <SelectDefaultPaymentDialog
            open={selectDefaultDialogOpen}
            onClose={handleCancelSelectDefault}
            onConfirm={handleConfirmSetDefault}
            paymentMethods={paymentMethods}
            selectedPaymentMethodId={selectedPaymentMethodId}
            defaultPaymentMethodId={defaultPaymentMethodId}
            loading={settingDefault}
            onPaymentMethodSelect={setSelectedPaymentMethodId}
          />
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
        <IconButton>
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
