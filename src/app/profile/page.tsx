"use client";
import { useEffect, useState, useRef } from "react";
import { getUser } from "@/shared/utils/auth";
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


export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    setUser(getUser());
  }, []);

  const handleDeleteAccount = async () => {
    await logOutAction(router)
  };

  const handleLogOut = async () => {
    await logOutAction(router)
  }

  const handleEdit = () => {
    alert("Edit profile feature coming soon!");
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
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
        onClick={() => router.push('/map')}
        sx={{
          position: 'absolute',
          top: 24,
          left: 24,
          background: 'none',
          boxShadow: 'none',
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
        }}
        aria-label="Logout"
      >
        <LogoutIcon />
      </IconButton>
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
            src={user?.avatar}
            sx={{ width: 72, height: 72, mx: "auto", fontSize: 36, bgcolor: "#E0E0E0" }}
            onClick={handleAvatarClick}
          >
            {user?.avatar
              ? ""
              : user?.first_name
              ? user.first_name[0].toUpperCase()
              : user?.email[0].toUpperCase() }
          </Avatar>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: "none" }}
            // onChange={handleAvatarChange}
          />
          <Typography variant="caption" color="text.secondary" display="block" mt={1}>
            Tap to change photo
          </Typography>
        </Box>
        <Typography variant="h6" mt={2} fontWeight={600} sx={{
          fontFamily: rootStyle.titleFontFamily,
          fontSize: "24px"
        }}>
          {user?.first_name || user?.last_name ? user?.first_name + " " + user?.last_name : "Unknown"}
        </Typography>
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
          <Typography variant="body2">Visa •••• 422</Typography>
          <IconButton size="small" onClick={handleEdit}>
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
    </Box>
  );
} 