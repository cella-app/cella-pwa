'use client';

import { createTheme } from '@mui/material';

export const rootStyle = {
	backgroundColor: "#FDFBF5",
	elementColor: "#0C3E2E",
	textColor: "#333",
	descriptionColor: "#6B6B6B",
	titleFontFamily: "Georgia, serif",
	mainFontFamily: "Inter, sans-serif",
	borderColorMain: "#c8c6c3"
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
		text: {
			primary: rootStyle.textColor,
			secondary: rootStyle.descriptionColor,
		},
	},
	typography: {
		fontFamily: rootStyle.mainFontFamily,
		button: {
			fontFamily: rootStyle.mainFontFamily,
			textTransform: 'none',
			fontWeight: 700,
		},
		// h1: {
		// 	fontFamily: rootStyle.titleFontFamily,
		// 	fontSize: '2.5rem',
		// 	fontWeight: 700,
		// 	color: rootStyle.textColor,
		// 	"@media (max-width:330px)": {
		// 		fontSize: "1.75rem",
		// 	},
		// },
		h5: {
			fontFamily: rootStyle.titleFontFamily,
			fontSize: '24px',
			fontWeight: 700,
			color: rootStyle.textColor,
			"@media (max-width:330px)": {
				fontSize: "20px",
			},
		},
		h3: {
			fontFamily: rootStyle.titleFontFamily,
			fontSize: '36px',
			fontWeight: 700,
			"@media (max-width:330px)": {
				fontSize: "30px",
			},
		},
		// h4: {
		// 	fontFamily: rootStyle.titleFontFamily,
		// 	fontSize: '1.5rem',
		// 	fontWeight: 500,
		// 	color: rootStyle.textColor,
		// 	"@media (max-width:330px)": {
		// 		fontSize: "1.1rem",
		// 	},
		// },
		h6: {
			fontSize: "20px",
			fontWeight: 700,
			color: rootStyle.textColor,
			"@media (max-width:330px)": {
				fontSize: "16px",
			},
		},
		body1: {
			fontFamily: rootStyle.mainFontFamily,
			fontSize: '16px',
			fontWeight: 300,
			color: rootStyle.textColor,
			"@media (max-width:330px)": {
				fontSize: "14px",
			},
		},
		// body2: {
		// 	fontFamily: rootStyle.mainFontFamily,
		// 	fontSize: '0.875rem',
		// 	color: rootStyle.descriptionColor,
		// 	"@media (max-width:330px)": {
		// 		fontSize: "0.8rem",
		// 	},
		// },
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
					"&.MuiButton-root": {
						fontFamily: rootStyle.mainFontFamily,
					},
					"@media (max-width:330px)": {
						height: "44px",
						// minWidth: "200px",
						fontSize: "14px",
						padding: "6px 12px",
					},
				},
				contained: {
					color: 'white',
					'&:hover': {
						backgroundColor: 'transparent',
						border: "1px solid",
						borderColor: rootStyle.elementColor,
						color: rootStyle.elementColor
					},
				},
				outlined: {
					backgroundColor: 'transparent',
					border: "1px solid",
					borderColor: rootStyle.elementColor,
					color: rootStyle.elementColor,
					'&:hover': {
						backgroundColor: rootStyle.elementColor,
						color: "white"
					},
				}
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
					"& .MuiOutlinedInput-root": {
						borderRadius: '8px',
						"& .MuiOutlinedInput-notchedOutline": {
							borderColor: rootStyle.borderColorMain,
							borderWidth: '1px',
						},
						"&:hover .MuiOutlinedInput-notchedOutline": {
							borderColor: '#00000033',
						},
						"&.Mui-focused .MuiOutlinedInput-notchedOutline": {
							borderColor: rootStyle.elementColor,
						},
					},
					"& .MuiOutlinedInput-input": {
						paddingLeft: '16px',
						paddingRight: '16px',
						fontFamily: rootStyle.mainFontFamily,
						fontSize: 'inherit',
					},
					"& .MuiInputLabel-root": {
						fontFamily: rootStyle.mainFontFamily,
						fontSize: 'inherit',
					},
					"@media (max-width:330px)": {
						minWidth: "200px",
						fontSize: "14px",
					},
				},
			},
		},
		MuiCard: {
			styleOverrides: {
				root: {
					borderRadius: '16px',
					"@media (max-width:330px)": {
						padding: "8px",
					},
				},
			},
		},
		MuiPaper: {
			styleOverrides: {
				root: {
					borderRadius: '16px',
					"@media (max-width:330px)": {
						padding: "8px",
					},
				},
			},
		},
		MuiAlert: {
			styleOverrides: {
				filledSuccess: {
					backgroundColor: '#0C3E2E',
					color: '#fff',
					opacity: "0.3",
					borderRadius: '16px',
					width: "250px",
					"@media (max-width:330px)": {
						width: "200px",
						fontSize: "14px",
					},
				},
				filledError: {
					backgroundColor: '#D14343',
					color: '#fff',
					borderRadius: '16px',
					width: "250px",
					"@media (max-width:330px)": {
						width: "200px",
						fontSize: "14px",
					},
				},
				filledWarning: {
					backgroundColor: '#FFB020',
					color: '#000',
					borderRadius: '16px',
					width: '250px',
					"@media (max-width:330px)": {
						width: "200px",
						fontSize: "14px",
					},
				},
				filledInfo: {
					backgroundColor: '#2F80ED',
					color: '#fff',
					borderRadius: '16px',
					width: '250px',
					"@media (max-width:330px)": {
						width: "200px",
						fontSize: "14px",
					},
				},
			},
		},
		MuiLink: {
			styleOverrides: {
				root: {
					color: rootStyle.elementColor,
					fontFamily: rootStyle.mainFontFamily,
					"@media (max-width:330px)": {
						fontSize: "14px",
					},
				},
			},
		}
	},
});
