
'use client';

import { Alert } from '@mui/material';
import { userAlertStore } from '@/features/alert/stores/alert.store';
import { useEffect, useState } from 'react';
import { SxProps, Theme } from '@mui/material';

interface AlertComponentProps {
  sx?: SxProps<Theme>;
}

export function AlertComponent({ sx }: AlertComponentProps) {
	const [mounted, setMounted] = useState<boolean>(false);
	const { alerts, removeAlert } = userAlertStore();

	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		if (mounted && alerts.length > 0) {
			const timer = setTimeout(() => {
				removeAlert(0);
			}, 3000);
			return () => clearTimeout(timer);
		}
	}, [alerts, removeAlert, mounted]);

	if (!mounted || alerts.length === 0) return null;

	const { severity, message } = alerts[0];

	return (
		<Alert severity={severity} variant="filled" sx={sx}>
			{message}
		</Alert>
	);
}
