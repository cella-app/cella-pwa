'use client';

import { userAlertStore } from '@/features/alert/stores/alert.store';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { getToken } from '@/shared/utils/auth';
import { Box, Container, Paper, useTheme } from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import { ReactNode, useEffect } from 'react';

interface AuthLayoutProps {
	children: ReactNode;
}

export default function AuthLayoutWrapper({ children }: AuthLayoutProps) {
	const theme = useTheme();
	
	const router = useRouter();
	const searchParams = useSearchParams();
	const { isAuthenticated, initializeAuth } = useAuthStore();
	const { clearAlerts } = userAlertStore()


	useEffect(() => {
		initializeAuth();
		clearAlerts();
		
		const from = searchParams?.get('from') || '/workspace/discovery';
		router.prefetch(from)

		const token = getToken();
		if (token || isAuthenticated) {
			router.push(from)
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isAuthenticated, searchParams]);


	return (
		<Box
			sx={{
				minHeight: '100vh',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				backgroundColor: theme.palette.background.default,
			}}
		>
			<Container maxWidth="lg">
				<Paper
					elevation={3}
					sx={{
						display: 'flex',
						borderRadius: '20px',
						overflow: 'hidden',
						backgroundColor: 'transparent',
						boxShadow: 'none',
						flexDirection: 'column',
						alignItems: 'center',
						minHeight: 'auto',
						[theme.breakpoints.down('md')]: {
							minHeight: 'auto',
						},
					}}
				>
					{children}
				</Paper>
			</Container>
		</Box>
	);
}
