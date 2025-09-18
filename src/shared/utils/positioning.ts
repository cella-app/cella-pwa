// utils/positioning.ts

// Constants for consistent spacing
export const BUTTON_SIZES = {
	ADD_TO_HOME: 48,
	LOCATE_CONTROL: 44,
} as const;

export const SPACING = {
	EDGE_MARGIN: 16, // 1rem = 16px (giống LocateControl)
	VERTICAL_MARGIN: 20,
	BUTTON_GAP: 0, // Khoảng cách giữa 2 buttons khi cạnh nhau
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

	console.log("🔍 getEnvironmentInfo detection:", {
		userAgent: ua,
		isIOS,
		isSafari,
		isStandalone,
		detectionMethod: isIOS ? 'iOS-specific' : 'desktop'
	});

	return { isSafari, isIOS, isStandalone };
}

// Unified bottom offset logic
export function getBottomOffset(isSafari: boolean, isIOS: boolean, isStandalone: boolean): string {
	console.log("🔍 getBottomOffset input:", { isSafari, isIOS, isStandalone });

	// PWA mode - use standard offset
	if (isStandalone) {
		console.log("✅ Case: PWA/Standalone - returning 12pt");
		return '12pt';
	}

	// iOS Safari - need extra space for bottom UI (URL bar ở dưới)
	if (isIOS && isSafari) {
		console.log("✅ Case: iOS Safari - returning 96pt (URL bar dưới)");
		return '96pt'; // Dịch lên để tránh URL bar dưới
	}

	// iOS other browsers (Chrome, etc) - tăng từ 4rem lên để đủ space
	if (isIOS) {
		console.log("✅ Case: iOS other browser - returning 80pt");
		return '80pt'; // Tăng từ 64pt (4rem) lên 80pt để đủ space cho AddToHome
	}

	// Desktop Safari - small space
	if (isSafari) {
		console.log("✅ Case: Desktop Safari - returning 32pt");
		return '32pt';
	}

	// Other browsers - standard
	console.log("✅ Case: Other browser - returning 12pt");
	return '12pt';
}

// Calculate bottom offset in pixels using native browser calculation
export function getBottomOffsetPixels(): number {
	if (typeof window === "undefined") {
		return 16; // fallback ~12pt
	}

	const env = getEnvironmentInfo();
	const bottomOffsetPt = getBottomOffset(env.isSafari, env.isIOS, env.isStandalone);
	
	// Use native browser calculation for accurate pt->px conversion
	const testDiv = document.createElement('div');
	testDiv.style.position = 'absolute';
	testDiv.style.visibility = 'hidden';
	testDiv.style.height = bottomOffsetPt;
	testDiv.style.bottom = '0';
	document.body.appendChild(testDiv);
	
	const pixelValue = testDiv.offsetHeight;
	document.body.removeChild(testDiv);
	
	console.log("🔢 getBottomOffsetPixels:", {
		ptValue: bottomOffsetPt,
		pixelValue,
		ratio: pixelValue / parseFloat(bottomOffsetPt)
	});
	
	return pixelValue;
}

// Positioning helpers for AddToHomeScreen
export function getInitialPosition(): { x: number; y: number } {
	if (typeof window === "undefined") {
		return { x: SPACING.EDGE_MARGIN, y: 100 };
	}

	const bottomOffsetPixels = getBottomOffsetPixels();
	// LocateControl ở bottom: offsetPt, nghĩa là top = window.height - offsetPx
	// AddToHome cần cùng Y position để align
	const initialY = window.innerHeight - bottomOffsetPixels;

	console.log("📍 getInitialPosition calculation:", {
		windowHeight: window.innerHeight,
		bottomOffsetPixels,
		calculatedY: initialY,
		finalY: Math.max(SPACING.VERTICAL_MARGIN, initialY)
	});

	return {
		x: SPACING.EDGE_MARGIN,
		y: Math.max(SPACING.VERTICAL_MARGIN, initialY)
	};
}

export function getMaxY(): number {
	if (typeof window === "undefined") return 100;

	const bottomOffsetPixels = getBottomOffsetPixels();
	// MaxY cũng cần align với LocateControl top position
	return window.innerHeight - bottomOffsetPixels;
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

// Lấy offset đặc biệt cho Safari mobile (pt để consistent hơn)
export function getSafariMobileOffset(): string {
	return '96pt'; // Giá trị cố định theo pt để đảm bảo không bị che bởi URL bar
}