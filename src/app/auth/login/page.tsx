"use client";

import { useEffect, useState, Suspense } from "react";
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
import { loginAction } from "@/features/auth/auth.action";
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
import { getToken } from "@/shared/utils/auth";

const loginSchema = z.object({
	email: z.string().email({ message: "Please enter a valid email address" }),
	password: z
		.string({ message: "Password is required" })
		.min(6, { message: "Password minimum 6 characters" }),
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
		} catch (err) {
			userAlertStore
				.getState()
				.addAlert({
					severity: SERVERIFY_ALERT.ERROR,
					message: "Login failed. Please try again.",
				});
			throw err;
		}
	};

	const togglePasswordVisibility = () =>
		setShowPassword((prev) => !prev);

	const breakpointMd = theme.breakpoints.up("md");

	return (
		<>
			{/* Title */}
			<Box
				sx={{
					flex: 1,
					display: "flex",
					color: "black",
					flexDirection: "column",
					justifyContent: "center",
					alignItems: "center",
					padding: "10px 20px",
					textAlign: "center",
					position: "relative",
					"&::before": {
						content: '""',
						position: "absolute",
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						opacity: 0.3,
					},
					[breakpointMd as string]: {
						padding: "10px 20px",
					},
				}}
			>
				<Typography
					variant="h1"
					sx={{
						fontSize: "36px",
						fontWeight: "bold",
						mb: 2,
						fontFamily: rootStyle.titleFontFamily,
					}}
				>
					Cella
				</Typography>
				<Typography
					variant="h3"
					sx={{
						fontSize: "24px !important",
						fontWeight: "bold",
						opacity: 0.9,
						fontFamily: rootStyle.titleFontFamily,
					}}
				>
					Welcome back.
				</Typography>
			</Box>

			{/* Form */}
			<Box
				sx={{
					flex: 1,
					padding: "10px 30px",
					display: "flex",
					flexDirection: "column",
					justifyContent: "center",
				}}
			>
				<form method="POST" onSubmit={handleSubmit(onSubmit)} noValidate>
					<FormControl sx={{ width: "100%" }}>
						<TextField
							fullWidth
							label="Email"
							type="email"
							margin="normal"
							{...register("email")}
							error={!!errors.email}
							helperText={errors.email?.message}
						/>

						<TextField
							fullWidth
							label="Password"
							type={showPassword ? "text" : "password"}
							margin="normal"
							{...register("password")}
							error={!!errors.password}
							helperText={errors.password?.message}
							InputProps={{
								endAdornment: (
									<InputAdornment position="end">
										<IconButton
											onClick={togglePasswordVisibility}
											edge="end"
										>
											{showPassword ? <VisibilityOff /> : <Visibility />}
										</IconButton>
									</InputAdornment>
								),
							}}
						/>

						<Button
							type="submit"
							fullWidth
							variant="contained"
							disabled={isLoading}
							sx={{ mt: 4 }}
						>
							{isLoading ? "Logging in..." : "Login"}
						</Button>

						<Typography
							variant="body2"
							sx={{
								textAlign: "center",
								mt: 3,
								color: "#333",
								fontWeight: 400,
							}}
						>
							Don&#39;t have an account?{" "}
							<Link
								href="/auth/register"
								sx={{
									color: "#0C3E2E",
									fontWeight: 600,
									textDecoration: "none",
									"&:hover": { textDecoration: "underline" },
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
	const { isAuthenticated, initializeAuth } = useAuthStore();
	const { clearAlerts, addAlert } = userAlertStore();
	const from = searchParams?.get("from") || "/workspace/discovery";

	useEffect(() => {
		initializeAuth();
		router.prefetch(from);
	}, [initializeAuth, router, from]);

	useEffect(() => {
		clearAlerts();
		const token = getToken();
		if (token || isAuthenticated) {
			addAlert({
				severity: SERVERIFY_ALERT.SUCCESS,
				message: "Login successfully!",
			});
			console.log("[auth] Redirecting to:", from);
			// router.replace(from);
			window.location.href = from;
		}
	}, [clearAlerts, isAuthenticated, addAlert, router, from]);

	return (
		<Suspense fallback={<div>Loading...</div>}>
			<LoginForm />
		</Suspense>
	);
}
