'use client';

import { Suspense } from 'react';
import { Box } from '@mui/material';
import AddCardPageContent from './AddCardPageContent';

export default function AddCardPage() {
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
			<Suspense fallback={<div>Loading...</div>}>
				<AddCardPageContent />
			</Suspense>
		</Box>
	);
}
