'use client';

import { Box, Container, Paper, useTheme } from '@mui/material';
import { ReactNode,  } from 'react';

interface AuthLayoutProps {
	children: ReactNode;
}

export default function AuthLayoutWrapper({ children }: AuthLayoutProps) {
	const theme = useTheme();
	
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
