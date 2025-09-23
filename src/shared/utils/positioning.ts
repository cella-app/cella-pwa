// utils/positioning.ts

// Constants for consistent spacing
export const BUTTON_SIZES = {
	ADD_TO_HOME: 48,
	LOCATE_CONTROL: 44,
} as const;

export const SPACING = {
	EDGE_MARGIN: 24, // Increased from 16px to 24px for better spacing from screen edges
	VERTICAL_MARGIN: 20,
	BUTTON_GAP: 8, // Small gap between buttons when side by side
} as const;

// Environment detection (shared between components)
export function isInStandaloneMode(): boolean {
	if (typeof window === "undefined") return false;
	const standalone = (
		window.matchMedia("(display-mode: standalone)").matches ||
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(window.navigator as any).standalone === true
	);
	return standalone;
}

export function getEnvironmentInfo() {
	if (typeof window === "undefined" || !window || !window.navigator) {
		return { isSafari: false, isIOS: false, isStandalone: false };
	}

	const ua = navigator.userAgent;
	const isIOS = /iPad|iPhone|iPod/.test(ua);
	const isStandalone = isInStandaloneMode();
	
	// Improved Safari detection for iOS
	let isSafari = false;
	if (isIOS) {
		// Chrome iOS has CriOS, Edge has EdgiOS, Firefox has FxiOS
		// Safari iOS has Version/ and Safari/ but no other browser identifiers
		isSafari = /safari/i.test(ua) && !/crios|edgios|fxios/i.test(ua);
	} else {
		// Desktop Safari detection
		isSafari = /^((?!chrome|android).)*safari/i.test(ua);
	}


	return { isSafari, isIOS, isStandalone };
}

// Unified bottom offset logic
export function getBottomOffset(isSafari: boolean, isIOS: boolean, isStandalone: boolean): string {
	// PWA mode - minimal spacing
	if (isStandalone) {
		return '12pt';
	}

	// iOS Safari - need space for URL bar at bottom, but not too much
	if (isIOS && isSafari) {
		return '70pt'; // Reduced further to bring closer to bottom
	}

	// iOS other browsers (Chrome, etc) - moderate spacing
	if (isIOS) {
		return '50pt'; // Reduced further
	}

	// Desktop Safari - minimal spacing
	if (isSafari) {
		return '16pt'; // Reduced further
	}

	// Other browsers - minimal spacing
	return '12pt'; // Back to minimal
}

// Calculate bottom offset in pixels using native browser calculation
export function getBottomOffsetPixels(): number {
	if (typeof window === "undefined" || !window || !window.innerHeight) {
		return 16; // fallback ~12pt
	}

	const env = getEnvironmentInfo();
	const bottomOffsetPt = getBottomOffset(env.isSafari, env.isIOS, env.isStandalone);
	
	// Check if we're in a test environment (jsdom)
	if (process.env.NODE_ENV === 'test' || !document.body.appendChild) {
		// Simple conversion for testing: 1pt ≈ 1.33px (standard ratio)
		const ptValue = parseFloat(bottomOffsetPt.replace('pt', ''));
		const pixelValue = Math.round(ptValue * 1.33);
		
		
		return pixelValue;
	}
	
	// Use native browser calculation for accurate pt->px conversion
	const testDiv = document.createElement('div');
	testDiv.style.position = 'absolute';
	testDiv.style.visibility = 'hidden';
	testDiv.style.height = bottomOffsetPt;
	testDiv.style.bottom = '0';
	document.body.appendChild(testDiv);
	
	const pixelValue = testDiv.offsetHeight;
	document.body.removeChild(testDiv);
	
	
	return pixelValue;
}

// Positioning helpers for AddToHomeScreen
export function getInitialPosition(): { x: number; y: number } {
	if (typeof window === "undefined" || !window || !window.innerHeight) {
		return { x: SPACING.EDGE_MARGIN, y: 100 }; // Fallback position when window not available
	}

	const bottomOffsetPixels = getBottomOffsetPixels();
	// LocateControl ở bottom: offsetPt, nghĩa là top = window.height - offsetPx - button_height
	// AddToHome cần cùng Y position để align horizontally với LocateControl
	const initialY = window.innerHeight - bottomOffsetPixels - BUTTON_SIZES.ADD_TO_HOME;


	return {
		x: SPACING.EDGE_MARGIN, // Position on left edge  
		y: Math.max(SPACING.VERTICAL_MARGIN, initialY)
	};
}

export function getMaxY(): number {
	if (typeof window === "undefined" || !window || !window.innerHeight) return 100;

	const bottomOffsetPixels = getBottomOffsetPixels();
	// MaxY cũng cần align với LocateControl top position
	return window.innerHeight - bottomOffsetPixels - BUTTON_SIZES.ADD_TO_HOME;
}

export function snapToEdge(mouseX: number): number {
	if (typeof window === "undefined" || !window || !window.innerWidth) return SPACING.EDGE_MARGIN;

	const centerX = window.innerWidth / 2;

	if (mouseX < centerX) {
		// Snap to left edge - đồng nhất với LocateControl
		return SPACING.EDGE_MARGIN;
	} else {
		// Snap to right edge - cạnh phải AddToHome thẳng hàng với cạnh phải LocateControl
		// LocateControl có right: EDGE_MARGIN, nghĩa là cạnh phải cách edge EDGE_MARGIN
		// AddToHome cần left = window.innerWidth - EDGE_MARGIN - ADD_TO_HOME_SIZE
		return window.innerWidth - SPACING.EDGE_MARGIN - BUTTON_SIZES.ADD_TO_HOME;
	}
}

// Calculate position when buttons are side by side (both on right)
export function getStackedRightPosition(): number {
	if (typeof window === "undefined" || !window || !window.innerWidth) return 100;

	// Position AddToHome button to the left of LocateControl with proper gap
	return window.innerWidth - SPACING.EDGE_MARGIN - BUTTON_SIZES.LOCATE_CONTROL - SPACING.BUTTON_GAP - BUTTON_SIZES.ADD_TO_HOME;
}

// Separate bottom offset for Locate button (easier touch access)
export function getLocateButtonBottomOffset(isSafari: boolean, isIOS: boolean, isStandalone: boolean): string {
	// PWA mode - comfortable touch spacing
	if (isStandalone) {
		return '16pt';
	}

	// iOS Safari - account for URL bar but keep accessible
	if (isIOS && isSafari) {
		return '50pt'; // Lower but still above URL bar
	}

	// iOS other browsers - moderate spacing for easy access
	if (isIOS) {
		return '30pt';
	}

	// Desktop Safari - comfortable spacing
	if (isSafari) {
		return '20pt';
	}

	// Other browsers - comfortable touch spacing
	return '16pt';
}

// Kiểm tra xem có phải Safari mobile không PWA không (URL bar dưới)
export function isSafariMobileNonPWA(): boolean {
	if (typeof window === "undefined") return false;
	
	const env = getEnvironmentInfo();
	return env.isIOS && env.isSafari && !env.isStandalone;
}

// Lấy offset đặc biệt cho Safari mobile (pt để consistent hơn)
export function getSafariMobileOffset(): string {
	return '96pt'; // Giá trị cố định theo pt để đảm bảo không bị che bởi URL bar
}