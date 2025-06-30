'use client';

import AddCardFormMui from '@/features/payment/AddCardForm';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, Typography } from '@mui/material';
import { rootStyle } from '@/theme';

export default function AddCardPageContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const from = searchParams.get('frm') || '/workspace/discovery';

	const handleSkip = () => {
		router.push(from);
	};

	return (
		<Box
			sx={{
				maxWidth: 500,
				borderRadius: 3,
				p: 4,
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				textAlign: "center",
				position: 'relative',
			}}
		>
			<Typography variant="h4" fontWeight={700} mb={2} sx={{
				fontSize: "36px",
				fontFamily: rootStyle.titleFontFamily
			}}>
				Add Your Card
			</Typography>
			<Typography
				fontWeight={700} mb={2} sx={{
					maxWidth: "300px",
					fontSize: "20px",
				}}
			>
				{"You'll only be charged after your session ends."}
			</Typography>
			<AddCardFormMui onSkip={handleSkip} />
			<Typography
				variant="caption"
				color="text.secondary"
				sx={{
					mt: 0,
					fontSize: '14px',
					maxWidth: '250px',
					color: rootStyle.textColor
				}}
			>
				{"You'll be asked again before starting your first session."}
			</Typography>
		</Box>
	);
}
