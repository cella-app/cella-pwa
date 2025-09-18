// utils/positioning.ts

// Constants for consistent spacing
export const BUTTON_SIZES = {
	ADD_TO_HOME: 48,
	LOCATE_CONTROL: 44,
} as const;

export const SPACING = {
	EDGE_MARGIN: 16, // 1rem = 16px (giống LocateControl)
	VERTICAL_MARGIN: 20,
	BUTTON_GAP: 8, // Khoảng cách giữa 2 buttons khi cạnh nhau
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
	if (typeof window === "undefined") {
		return { isSafari: false, isIOS: false, isStandalone: false };
	}

	const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
	const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
	const isStandalone = isInStandaloneMode();

	return { isSafari, isIOS, isStandalone };
}

// Unified bottom offset logic
export function getBottomOffset(isSafari: boolean, isIOS: boolean, isStandalone: boolean): string {
	console.log("🔍 getBottomOffset input:", { isSafari, isIOS, isStandalone });

	// PWA mode - use standard offset
	if (isStandalone) {
		console.log("✅ Case: PWA/Standalone - returning 0.75rem");
		return '0.75rem';
	}

	// iOS Safari - need extra space for bottom UI (URL bar ở dưới)
	if (isIOS && isSafari) {
		console.log("✅ Case: iOS Safari - returning 6rem (URL bar dưới)");
		return '6rem'; // Dịch lên để tránh URL bar dưới
	}

	// iOS other browsers (Chrome, etc) - unified value
	if (isIOS) {
		console.log("✅ Case: iOS other browser - returning 4rem");
		return '4rem'; // ✅ Consistent với LocateControl
	}

	// Desktop Safari - small space
	if (isSafari) {
		console.log("✅ Case: Desktop Safari - returning 2rem");
		return '2rem';
	}

	// Other browsers - standard
	console.log("✅ Case: Other browser - returning 0.75rem");
	return '0.75rem';
}

// Convert rem to pixels (assuming 1rem = 16px)
export function remToPixels(remValue: string): number {
	const numValue = parseFloat(remValue);
	return numValue * 16;
}

// Calculate bottom offset in pixels
export function getBottomOffsetPixels(): number {
	if (typeof window === "undefined") {
		return remToPixels('0.75rem'); // fallback
	}

	const env = getEnvironmentInfo();
	const bottomOffsetRem = getBottomOffset(env.isSafari, env.isIOS, env.isStandalone);
	return remToPixels(bottomOffsetRem);
}

// Positioning helpers for AddToHomeScreen
export function getInitialPosition(): { x: number; y: number } {
	if (typeof window === "undefined") {
		return { x: SPACING.EDGE_MARGIN, y: 100 };
	}

	const bottomOffsetPixels = getBottomOffsetPixels();
	// Đảm bảo Add Home button thẳng hàng với LocateControl bằng cách dùng cùng size reference
	const initialY = window.innerHeight - bottomOffsetPixels - BUTTON_SIZES.LOCATE_CONTROL;

	return {
		x: SPACING.EDGE_MARGIN,
		y: Math.max(SPACING.VERTICAL_MARGIN, initialY)
	};
}

export function getMaxY(): number {
	if (typeof window === "undefined") return 100;

	const bottomOffsetPixels = getBottomOffsetPixels();
	// Đảm bảo MaxY cũng dùng cùng reference với LocateControl để thẳng hàng
	return window.innerHeight - bottomOffsetPixels - BUTTON_SIZES.LOCATE_CONTROL;
}

export function snapToEdge(mouseX: number): number {
	if (typeof window === "undefined") return SPACING.EDGE_MARGIN;

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
	if (typeof window === "undefined") return 100;

	// Position để AddToHome button sát bên trái của LocateControl
	return window.innerWidth - SPACING.EDGE_MARGIN - BUTTON_SIZES.LOCATE_CONTROL - SPACING.BUTTON_GAP - BUTTON_SIZES.ADD_TO_HOME;
}

// Kiểm tra xem có phải Safari mobile không PWA không (URL bar dưới)
export function isSafariMobileNonPWA(): boolean {
	if (typeof window === "undefined") return false;
	
	const env = getEnvironmentInfo();
	return env.isIOS && env.isSafari && !env.isStandalone;
}

// Lấy offset đặc biệt cho Safari mobile (rem để responsive hơn)
export function getSafariMobileOffset(): string {
	return '6rem'; // Giá trị cố định theo pt để đảm bảo không bị che bởi URL bar
}