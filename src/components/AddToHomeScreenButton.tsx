/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import InstallGuidePopup from "./InstallGuidePopup";
import { useAddToHomeScreenStore } from "@/features/add-to-home-screen/stores/add-to-home-screen.store";

const getButtonStyle = (isDragging: boolean, position: { x: number; y: number }): React.CSSProperties => ({
  position: "fixed",
  left: position.x,
  top: position.y,
  zIndex: 1000,
  background: "#fff",
  border: "1px solid #ccc",
  borderRadius: "50%",
  width: 48,
  height: 48,
  boxShadow: isDragging ? "0 4px 16px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.15)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: isDragging ? "grabbing" : "grab",
  userSelect: "none",
  transition: isDragging ? "none" : "box-shadow 0.2s ease",
  opacity: isDragging ? 0.8 : 1,
});

function isIOS() {
  if (typeof window === "undefined") return false;
  const ios = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
  console.log("🔍 AddToHomeScreen - isIOS:", ios);
  return ios;
}

function isInStandaloneMode() {
  if (typeof window === "undefined") return false;
  const standalone = (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
  console.log("🔍 AddToHomeScreen - isInStandaloneMode:", {
    standalone,
    displayMode: window.matchMedia("(display-mode: standalone)").matches,
    navigatorStandalone: (window.navigator as any).standalone
  });
  return standalone;
}

function getBrowserType(): "safari" | "chrome" | "other" {
  if (typeof window === "undefined") return "other";
  const ua = window.navigator.userAgent.toLowerCase();

  let browserType: "safari" | "chrome" | "other" = "other";

  if (/iphone|ipad|ipod/.test(ua)) {
    if (ua.includes("crios")) browserType = "chrome"; // iOS Chrome
    else if (ua.includes("fxios")) browserType = "chrome"; // treat Firefox iOS also with Chrome guide
    else if (ua.includes("edgios")) browserType = "chrome"; // Edge iOS likewise
    else browserType = "safari"; // Safari
  } else if (ua.includes("chrome") && !ua.includes("edg")) {
    browserType = "chrome"; // Android Chrome
  }

  console.log("🔍 AddToHomeScreen - getBrowserType:", {
    browserType,
    userAgent: ua
  });

  return browserType;
}

// Match LocateControl environment detection
function getEnvironmentInfo() {
  if (typeof window === "undefined") {
    return { isSafari: false, isIOS: false, isStandalone: false };
  }

  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isStandalone = isInStandaloneMode();

  console.log("🔍 AddToHomeScreen - Environment:", {
    isSafari,
    isIOS,
    isStandalone,
    userAgent: navigator.userAgent,
    windowHeight: window.innerHeight
  });

  return { isSafari, isIOS, isStandalone };
}

// Match LocateControl bottom offset logic EXACTLY
function getBottomOffset(isSafari: boolean, isIOS: boolean, isStandalone: boolean): string {
  console.log("🔍 AddToHomeScreen - getBottomOffset input:", { isSafari, isIOS, isStandalone });

  // PWA mode - use standard offset
  if (isStandalone) {
    console.log("✅ AddToHomeScreen Case: PWA/Standalone - returning 0.75rem");
    return '0.75rem';
  }

  // iOS Safari - need extra space for bottom UI
  if (isIOS && isSafari) {
    console.log("✅ AddToHomeScreen Case: iOS Safari - returning 6rem");
    return '6rem';
  }

  // iOS other browsers (Chrome, etc) - moderate space
  if (isIOS) {
    console.log("✅ AddToHomeScreen Case: iOS other browser - returning 4rem");
    return '4rem';
  }

  // Desktop Safari - small space
  if (isSafari) {
    console.log("✅ AddToHomeScreen Case: Desktop Safari - returning 2rem");
    return '2rem';
  }

  // Other browsers - standard
  console.log("✅ AddToHomeScreen Case: Other browser - returning 0.75rem");
  return '0.75rem';
}

// Convert rem to pixels (assuming 1rem = 16px)
function remToPixels(remValue: string): number {
  const numValue = parseFloat(remValue);
  return numValue * 16;
}

// Calculate bottom offset in pixels to match LocateControl
function getBottomOffsetPixels(): number {
  if (typeof window === "undefined") {
    console.log("🔍 AddToHomeScreen - getBottomOffsetPixels: window undefined, returning 68");
    return 68;
  }

  const env = getEnvironmentInfo();
  const bottomOffsetRem = getBottomOffset(env.isSafari, env.isIOS, env.isStandalone);
  const bottomOffsetPixels = remToPixels(bottomOffsetRem);

  console.log("🔍 AddToHomeScreen - getBottomOffsetPixels:", {
    bottomOffsetRem,
    bottomOffsetPixels,
    environment: env
  });

  return bottomOffsetPixels;
}

export default function AddToHomeScreenButton() {
  const { showButton, showIOSPopup, setShowButton, setShowIOSPopup } =
    useAddToHomeScreenStore();

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [browserType, setBrowserType] = useState<"safari" | "chrome" | "other">(
    "other"
  );
  const [position, setPosition] = useState({ x: 20, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Initialize position based on LocateControl logic
  useEffect(() => {
    if (typeof window !== "undefined") {
      console.log("🚀 AddToHomeScreen - Initializing position...");
      const bottomOffsetPixels = getBottomOffsetPixels();
      const initialY = window.innerHeight - bottomOffsetPixels - 48; // 48px for button height
      console.log("📍 AddToHomeScreen - Initial position calculation:", {
        windowHeight: window.innerHeight,
        bottomOffsetPixels,
        initialY
      });
      setPosition({ x: 20, y: initialY });
    }
  }, []);

  // Handle viewport changes (for Safari mobile URL bar show/hide)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      console.log("📏 AddToHomeScreen - handleResize triggered");
      const bottomOffsetPixels = getBottomOffsetPixels();
      const newMaxY = window.innerHeight - bottomOffsetPixels - 48;

      console.log("📏 AddToHomeScreen - Resize calculation:", {
        windowHeight: window.innerHeight,
        bottomOffsetPixels,
        newMaxY,
        currentPosition: position
      });

      setPosition(prev => {
        const newY = Math.min(prev.y, newMaxY);
        console.log("📏 AddToHomeScreen - Position update:", {
          prevY: prev.y,
          newY,
          changed: prev.y !== newY
        });
        return {
          ...prev,
          y: newY
        };
      });
    };

    // Listen for visual viewport changes (iOS Safari)
    const visualViewport = (window as any).visualViewport;
    if (visualViewport) {
      console.log("👁️ AddToHomeScreen - Adding visualViewport listener");
      visualViewport.addEventListener('resize', handleResize);
    }

    // Fallback for regular window resize
    console.log("🖼️ AddToHomeScreen - Adding window resize listener");
    window.addEventListener('resize', handleResize);

    // Also listen for display-mode changes (PWA transitions)
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      console.log("🔄 AddToHomeScreen - Display mode changed:", e.matches ? 'standalone' : 'browser');
      setTimeout(handleResize, 100); // Small delay for transition
    };
    mediaQuery.addEventListener('change', handleDisplayModeChange);

    return () => {
      console.log("🧹 AddToHomeScreen - Cleaning up event listeners");
      if (visualViewport) {
        visualViewport.removeEventListener('resize', handleResize);
      }
      window.removeEventListener('resize', handleResize);
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, [position]);

  useEffect(() => {
    console.log("🎯 AddToHomeScreen - Main effect - checking display mode and browser");
    if (isInStandaloneMode()) {
      console.log("🔒 AddToHomeScreen - In standalone mode - hiding button");
      setShowButton(false);
      setShowIOSPopup(false);
      return;
    }

    const type = getBrowserType();
    setBrowserType(type);
    console.log("🌐 AddToHomeScreen - Browser type set:", type);

    if (isIOS()) {
      console.log("📱 AddToHomeScreen - iOS detected - showing button");
      // iOS (Safari & other WebKit browsers): show button to open popup
      setShowButton(true);
      return;
    }

    // Android Chrome: listen for PWA prompt
    if (type === "chrome") {
      console.log("🤖 AddToHomeScreen - Android Chrome detected - listening for install prompt");
      const handler = (e: any) => {
        console.log("💾 AddToHomeScreen - Install prompt received");
        e.preventDefault();
        setDeferredPrompt(e);
        setShowButton(true);
      };
      window.addEventListener("beforeinstallprompt", handler);
      return () => {
        console.log("🧹 AddToHomeScreen - Removing install prompt listener");
        window.removeEventListener("beforeinstallprompt", handler);
      };
    }

    console.log("❓ AddToHomeScreen - Other browser type - no special handling");
  }, [setShowButton, setShowIOSPopup]);

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const mouseX = e.clientX - dragStart.x + 24; // +24 for button center
    const mouseY = e.clientY - dragStart.y + 24;

    // Only snap to left or right edge (like iPhone AssistiveTouch)
    const centerX = window.innerWidth / 2;
    const bottomOffsetPixels = getBottomOffsetPixels();
    const maxY = window.innerHeight - bottomOffsetPixels - 48; // Match LocateControl bounds
    const newY = Math.max(20, Math.min(maxY, mouseY - 24));

    let newX;
    if (mouseX < centerX) {
      // Snap to left edge
      newX = 20;
    } else {
      // Snap to right edge - next to LocateControl (same horizontal line)
      newX = window.innerWidth - 96; // 48px this button + 48px LocateControl = sát nhau
    }

    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    });
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();

    const touch = e.touches[0];
    const mouseX = touch.clientX - dragStart.x + 24; // +24 for button center
    const mouseY = touch.clientY - dragStart.y + 24;

    // Only snap to left or right edge (like iPhone AssistiveTouch)
    const centerX = window.innerWidth / 2;
    const bottomOffsetPixels = getBottomOffsetPixels();
    const maxY = window.innerHeight - bottomOffsetPixels - 48; // Match LocateControl bounds
    const newY = Math.max(20, Math.min(maxY, mouseY - 24));

    let newX;
    if (mouseX < centerX) {
      // Snap to left edge
      newX = 12;
    } else {
      // Snap to right edge - next to LocateControl (same horizontal line)
      newX = window.innerWidth - 60; // 48px this button + 48px LocateControl = sát nhau
    }

    console.log(newX)

    setPosition({ x: newX, y: newY });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Add event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, dragStart]);

  const handleClick = (e: React.MouseEvent) => {
    // Only handle click if not dragging
    if (isDragging) {
      e.preventDefault();
      return;
    }

    console.log("🔘 AddToHomeScreen - Button clicked");

    if (isIOS()) {
      // iOS: luôn mở popup với guideType dựa trên browserType
      console.log("📱 AddToHomeScreen - iOS: Opening guide popup");
      setShowIOSPopup(true);
    } else {
      // Android
      if (deferredPrompt) {
        // Chrome PWA
        console.log("🚀 AddToHomeScreen - Android: Showing native install prompt");
        deferredPrompt.prompt();
        deferredPrompt.userChoice.finally((choice: any) => {
          setDeferredPrompt(null);
          setShowButton(false);
          console.log(
            choice?.outcome === "accepted"
              ? "✅ AddToHomeScreen - User accepted install prompt"
              : "❌ AddToHomeScreen - User dismissed install prompt"
          );
        });
      } else {
        // fallback: mở popup Chrome guide nếu browser khác
        console.log("📖 AddToHomeScreen - Android: Opening fallback guide popup");
        setShowIOSPopup(true);
      }
    }
  };

  if (!showButton) return null;

  // Trong store chỉ dùng showIOSPopup cho cả hai: safari và chrome guide
  const guideType: "safari" | "chrome" =
    browserType === "safari" ? "safari" : "chrome";
  const title =
    guideType === "safari"
      ? "App Installation Guide (iOS Safari)"
      : "App Installation Guide (Chrome)";

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        style={getButtonStyle(isDragging, position)}
        aria-label={isIOS() ? "Add to Home Screen Guide" : "Install App"}
        title={isIOS() ? "Add to Home Screen Guide" : "Install App"}
      >
        <Image src="/pwa/iconDo.png" alt="Add to Home Screen" width={20} height={24} />
      </button>

      <InstallGuidePopup
        showPopup={showIOSPopup}
        onClose={() => setShowIOSPopup(false)}
        title={title}
        guideType={guideType}
      />
    </>
  );
}