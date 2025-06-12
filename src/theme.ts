'use client';

import { createTheme } from '@mui/material';

export const rootStyle = {
	backgroundColor: "#FDFBF5",
	elementColor: "#0C3E2E",
	textColor: "#333",
	descriptionColor: "#6B6B6B",
	titleFontFamily: "Georgia, serif",
	mainFontFamily: "Inter, sans-serif"
}

export default createTheme({
	palette: {
		primary: {
			main: rootStyle.elementColor,
		},
		background: {
			default: rootStyle.backgroundColor,
			paper: '#ffffff',
		},
	},
	typography: {
		fontFamily: rootStyle.mainFontFamily,
		button: {
			fontFamily: rootStyle.mainFontFamily,
			textTransform: 'none',
			fontWeight: 700,
		},
	},
	components: {
		MuiButton: {
			styleOverrides: {
				root: {
					borderRadius: '16px',
					height: '56px',
					minWidth: "272px",
					textTransform: 'none',
					fontFamily: rootStyle.mainFontFamily,
					fontSize: '16px',
					fontWeight: '700',
					'&.MuiButton-root': {
						fontFamily: rootStyle.mainFontFamily,
					},
				},
			},
		},
		MuiTextField: {
			styleOverrides: {
				root: {
					minWidth: "272px",
					fontFamily: rootStyle.mainFontFamily,
					textTransform: 'none',
					fontSize: '16px',
					fontWeight: '700',

					'& .MuiOutlinedInput-root': {
						borderRadius: '8px',

						'& .MuiOutlinedInput-notchedOutline': {
							borderColor: 'Neutral/Light',
							borderWidth: '1px',
						},

						'&:hover .MuiOutlinedInput-notchedOutline': {
							borderColor: '#00000033',
						},

						'&.Mui-focused .MuiOutlinedInput-notchedOutline': {
							borderColor: rootStyle.elementColor,
						},
					},

					'& .MuiOutlinedInput-input': {
						paddingLeft: '16px',
						paddingRight: '16px',
						fontFamily: rootStyle.mainFontFamily,
						fontSize: 'inherit',
					},

					'& .MuiInputLabel-root': {
						fontFamily: rootStyle.mainFontFamily,
						fontSize: 'inherit',
					},
				},
			},
		},
		MuiCard: {
			styleOverrides: {
				root: {
					borderRadius: '16px',
				},
			},
		},
		MuiPaper: {
			styleOverrides: {
				root: {
					borderRadius: '16px',
				},
			},
		},
		MuiAlert: {
			styleOverrides: {
				filledSuccess: {
					backgroundColor: '#3B9C7A',
					color: '#fff',
				},
				filledError: {
					backgroundColor: '#D14343',
					color: '#fff',
				},
				filledWarning: {
					backgroundColor: '#FFB020',
					color: '#000',
				},
				filledInfo: {
					backgroundColor: '#2F80ED',
					color: '#fff',
				},
			},
		},
		MuiLink: {
			styleOverrides: {
				root: {
					color: rootStyle.elementColor,
					fontFamily: rootStyle.mainFontFamily,
				},
			},
		}
		
	},
});
