"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import {
	Box,
	TextField,
	Button,
	Typography,
	IconButton,
	InputAdornment,
	Link,
	FormControl,
	useTheme,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { loginAction, syncTokenAction } from "@/features/auth/auth.action";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { rootStyle } from "@/theme";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import {
	SERVERIFY_ALERT,
	userAlertStore,
} from "@/features/alert/stores/alert.store";
import { getToken, clearAuth } from "@/shared/utils/auth";

const loginSchema = z.object({
	email: z.string().email({ message: "Please enter a valid email address" }),
	password: z
		.string({ message: "Password is required" })
		.min(6, { message: "Password must be at least 6 characters" })
		.max(128, { message: "Password cannot exceed 128 characters" }),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginForm() {
	const theme = useTheme();
	const { isLoading } = useAuthStore();
	const [showPassword, setShowPassword] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<LoginFormData>({
		resolver: zodResolver(loginSchema),
	});

	const onSubmit = async (data: LoginFormData) => {
		try {
			await loginAction(data.email, data.password);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (err: any) {
			const errorMessage =
				err.message === "Invalid credentials"
					? "Invalid email or password."
					: "Login failed. Please try again later.";
			userAlertStore.getState().addAlert({
				severity: SERVERIFY_ALERT.ERROR,
				message: errorMessage,
			});
			throw err;
		}
	};

	const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

	const breakpointMd = theme.breakpoints.up("md");

	return (
		<>
			<Box
				sx={{
					flex: 1,
					display: 'flex',
					color: 'black',
					flexDirection: 'column',
					justifyContent: 'center',
					alignItems: 'center',
					padding: '10px 20px',
					textAlign: 'center',
					position: 'relative',
					'&::before': {
						content: '""',
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						opacity: 0.3,
					},
					[breakpointMd as string]: {
						padding: '10px 20px',
					},
				}}
			>
				<Typography
					variant="h1"
					sx={{
						fontSize: '36px',
						fontWeight: 'bold',
						mb: 2,
						fontFamily: rootStyle.titleFontFamily,
					}}
				>
					Cella
				</Typography>
				<Typography
					variant="h3"
					sx={{
						fontSize: '24px !important',
						fontWeight: 'bold',
						opacity: 0.9,
						fontFamily: rootStyle.titleFontFamily,
					}}
				>
					Welcome back.
				</Typography>
			</Box>

			{/* Form Section */}
			<Box
				sx={{
					flex: 1,
					padding: '10px 30px',
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'center',
				}}
			>
				<form method='POST' onSubmit={handleSubmit(onSubmit)} noValidate>
					<FormControl sx={{ width: '100%' }}>
						<TextField
							fullWidth
							label="Email"
							type="email"
							margin="normal"
							{...register('email')}
							error={!!errors.email}
							helperText={errors.email?.message}
						/>

						<TextField
							fullWidth
							label="Password"
							type={showPassword ? 'text' : 'password'}
							margin="normal"
							{...register('password')}
							error={!!errors.password}
							helperText={errors.password?.message}
							slotProps={{
								input:{
									endAdornment: (
										<InputAdornment position="end">
											<IconButton
												onClick={togglePasswordVisibility}
												edge="end"
												aria-label="toggle password visibility"
												sx={{
													p: 1.5,
													minWidth: 44,
													minHeight: 44
												}}
											>
												{showPassword ? <VisibilityOff /> : <Visibility />}
											</IconButton>
										</InputAdornment>
									),}}}				
							sx={{ mb: 2 }}
						/>

						<Button
							type="submit"
							fullWidth
							variant="contained"
							disabled={isLoading}
							sx={{
								mt: 3,
								py: 1.5,
								backgroundColor: "#0C3E2E",
								"&:hover": { backgroundColor: "#0A2F22" },
								color:`${isLoading? "gray": "white"}`,
							}}
						>
							{isLoading ? 'Logging in...' : 'Login'}
						</Button>

						<Typography
							variant="body2"
							sx={{
								textAlign: 'center',
								mt: 3,
								color: '#333',
								fontWeight: 400,
							}}
						>
							Don&#39;t have an account?{' '}
							<Link
								href="/auth/register"
								sx={{
									color: '#0C3E2E',
									fontWeight: 600,
									textDecoration: 'none',
									'&:hover': { textDecoration: 'underline' },
								}}
							>
								Sign up
							</Link>
						</Typography>
					</FormControl>
				</form>
			</Box>
		</>
	);
}

export default function LoginPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { isAuthenticated, initializeAuth, logout } = useAuthStore(); // Giả sử logout có trong store
	const { clearAlerts, addAlert } = userAlertStore();
	const from = searchParams?.get("from") || "/workspace/discovery";
	const [isCheckingToken, setIsCheckingToken] = useState(true);

	const syncUpToken = useCallback(async (token: string) => {
		try {
			await syncTokenAction(token); // Gọi API để xác thực hoặc làm mới token
			return true;
		} catch (err) {
			console.error("[auth] Token sync failed:", err);
			return false;
		}
	}, []);

	useEffect(() => {
		const initialize = async () => {
			await initializeAuth(); // Khởi tạo auth
			const token = getToken();
			if (token) {
				const isTokenValid = await syncUpToken(token);
				if (!isTokenValid) {
					logout(); // Xóa token và đặt isAuthenticated về false
					clearAuth(); // Xóa token khỏi localStorage
					addAlert({
						severity: SERVERIFY_ALERT.INFO,
						message: "Session expired. Please log in again.",
					});
				}
			}
			setIsCheckingToken(false);
			router.prefetch(from);
		};
		initialize();
	}, [initializeAuth, syncUpToken, logout, clearAlerts, addAlert, router, from]);

	useEffect(() => {
		if (isCheckingToken) return; // Chờ kiểm tra token xong
		clearAlerts();
		const token = getToken();
		if (token && isAuthenticated) {
			addAlert({
				severity: SERVERIFY_ALERT.SUCCESS,
				message: "Login successful!",
			});
			console.log("[auth] Redirecting to:", from);
			window.location.href = from;
		}
	}, [isCheckingToken, isAuthenticated, clearAlerts, addAlert, router, from]);

	if (isCheckingToken) {
		return <div>Checking authentication...</div>; // Hoặc loading spinner
	}

	return (
		<Suspense fallback={<div>Loading...</div>}>
			<LoginForm />
		</Suspense>
	);
}