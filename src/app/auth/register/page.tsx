'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
	Box,
	TextField,
	Button,
	Typography,
	IconButton,
	InputAdornment,
	Link,
	FormControl,
	useTheme
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { rootStyle } from '@/theme';
import { registerAction } from '@/features/auth/auth.action';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const registerSchema = z.object({
	email: z.string().email({ message: 'Email Invalid' }),
	password: z.string().min(6, { message: 'Password minimum 6 characters' }),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
	const theme = useTheme();
	const router = useRouter();
	const { isLoading, initializeAuth, isAuthenticated } = useAuthStore();

	const [showPassword, setShowPassword] = useState(false);
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<RegisterFormData>({
		resolver: zodResolver(registerSchema),
	});
	
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
		initializeAuth();
	}, [initializeAuth]);

	useEffect(() => {
		if (mounted && isAuthenticated) {
			router.push('/');
		}
	}, [isAuthenticated, router, mounted]);

	const onSubmit = async (data: RegisterFormData) => {
		try {
			await registerAction(data.email, data.password);
			router.push('/');
		} catch (err) {
			console.error('Login failed:', err);
		}
	};

	const togglePasswordVisibility = () => {
		setShowPassword(!showPassword);
	};

	// Prevent hydration mismatch by not rendering until mounted
	if (!mounted) {
		return null;
	}

	return (
		<>
			{/* Welcome Section */}
			<Box
				sx={{
					flex: 1,
					display: 'flex',
					color: "black",
					flexDirection: 'column',
					justifyContent: 'center',
					alignItems: 'center',
					padding: '10px 40px',
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
					[theme.breakpoints.down('md')]: {
						padding: '10px 20px',
					},
				}}
			>
				<Typography
					variant="h3"
					sx={{
						fontSize: '24px !important',
						fontWeight: 'bold',
						opacity: 0.9,
						fontFamily: rootStyle.titleFontFamily,
						position: 'relative',
						zIndex: 1,
						[theme.breakpoints.down('sm')]: {
							fontSize: '1.1rem',
						},
					}}
				>
					Create an account
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
					[theme.breakpoints.down('md')]: {
						padding: '10px 30px',
					},
				}}
			>
				<form onSubmit={handleSubmit(onSubmit)} noValidate>
				<FormControl sx={{
					width: "fit-content"
				}}>
					<TextField
						fullWidth
						label="Email"
						margin="normal"
						{...register('email')}
						error={!!errors.email}
						helperText={errors.email?.message}
						variant="outlined"
					/>

					<TextField
						fullWidth
						label="Password"
						type={showPassword ? 'text' : 'password'}
						{...register('password')}
						error={!!errors.password}
						helperText={errors.password?.message}
						required
						margin="normal"
						variant="outlined"
						InputProps={{
							endAdornment: (
								<InputAdornment position="end">
									<IconButton
										aria-label="toggle password visibility"
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
						sx={{
							marginTop: "36px",
						}}
					>
						{isLoading ? 'Creating...' : 'Create Account'}
					</Button>

					<Typography
						variant="body2"
						sx={{
							textAlign: 'center',
							fontFamily: rootStyle.mainFontFamily,
							mt: 3,
							color: '#333',
							fontWeight: 400
						}}
					>
						Already have an account?{' '}
						<Link
							href="/auth/login"
							sx={{
								color: rootStyle.elementColor,
								fontWeight: 600,
								fontFamily: rootStyle.mainFontFamily,
								textDecoration: 'none',
								'&:hover': {
									textDecoration: 'underline',
								},
							}}
						>
							Log in
						</Link>
					</Typography>

					<Box sx={{ mt: 3 }}>
						<Typography
							variant="body2"
							sx={{
								textAlign: 'center',
								fontFamily: rootStyle.mainFontFamily,
								color: rootStyle.descriptionColor,
								fontWeight: 400
							}}
						>
							By signing up, you agree to our
						</Typography>
						<Typography
							variant="body2"
							sx={{
								textAlign: 'center',
								fontFamily: rootStyle.mainFontFamily,
								color: rootStyle.descriptionColor,
								fontWeight: 400
							}}
						>
							<Link
								href="/privacy-policy"
								sx={{
									color: rootStyle.elementColor,
									fontWeight: 600,
									fontFamily: rootStyle.mainFontFamily,
									textDecoration: 'none',
									'&:hover': {
										textDecoration: 'underline',
									},
								}}
							>
								Privacy Policy
							</Link>
							{' '}and{' '}
							<Link
								href="/terms"
								sx={{
									color: rootStyle.elementColor,
									fontWeight: 600,
									fontFamily: rootStyle.mainFontFamily,
									textDecoration: 'none',
									'&:hover': {
										textDecoration: 'underline',
									},
								}}
							>
								Terms of Use
							</Link>
						</Typography>
					</Box>
					</FormControl>
					</form>
			</Box>
		</>
	);
}
