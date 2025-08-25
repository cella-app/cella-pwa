'use client';

import { useEffect, useState, Suspense } from 'react';
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
import { loginAction } from '@/features/auth/auth.action';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { rootStyle } from '@/theme';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { userAlertStore } from '@/features/alert/stores/alert.store';
import { getToken } from '@/shared/utils/auth';

const loginSchema = z.object({
	email: z.string().email({ message: 'Please enter a valid email address' }),
	password: z.string({ message: "“Password is required"}).min(6, { message: 'Password minimum 6 characters' }),
});

type LoginFormData = z.infer<typeof loginSchema>;


function LoginForm() {
	const theme = useTheme();
	const router = useRouter();
	const searchParams = useSearchParams();
	const { isLoading ,isAuthenticated} = useAuthStore();

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
			// setTimeout(() => {
			// 	const from = searchParams?.get('from') || '/workspace/discovery';
			// 	router.push(from);
			// }, TIMEOUT_REDIRECT_LOGIN);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (err: any) {
			
			throw err					
		}
	};




	const togglePasswordVisibility = () => {
		setShowPassword((prev) => !prev);
	};

	const breakpointMd = theme.breakpoints.up('md');

	useEffect(()=>{
		const from = searchParams?.get('from') || '/workspace/discovery';
		if(isAuthenticated){
			console.log('[auth] Login success: ', from)
			router.replace(from); 
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	},[isAuthenticated])
	
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
							slotProps={{htmlInput:{
								endAdornment: (
									<InputAdornment position="end">
										<IconButton onClick={togglePasswordVisibility} edge="end">
											{showPassword ? <VisibilityOff /> : <Visibility />}
										</IconButton>
									</InputAdornment>
								),
							}}}
						/>

						<Button
							type="submit"
							fullWidth
							variant="contained"
							disabled={isLoading}
							sx={{ mt: 4 }}
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
	const { isAuthenticated, initializeAuth } = useAuthStore();
	const { clearAlerts } = userAlertStore()
	const from = searchParams?.get('from') || '/workspace/discovery';

	useEffect(()=>{
		initializeAuth();
		router.prefetch(from);
	// eslint-disable-next-line react-hooks/exhaustive-deps
	},[])

	useEffect(() => {
		clearAlerts();
		const token = getToken();
		if (token || isAuthenticated) {
			router.replace(from)
			console.log('[auth] Page redirect: ', from)
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isAuthenticated, searchParams]);

	return (
		<Suspense fallback={<div>Loading...</div>}>
			<LoginForm />
		</Suspense>
	);
}
