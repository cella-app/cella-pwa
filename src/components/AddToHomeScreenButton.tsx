/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import InstallGuidePopup from "./InstallGuidePopup";
import { useAddToHomeScreenStore } from "@/features/add-to-home-screen/stores/add-to-home-screen.store";
import {
  getInitialPosition,
  getMaxY,
  snapToEdge,
  SPACING,
  BUTTON_SIZES,
  isInStandaloneMode
} from "@/shared/utils/positioning";

const getButtonStyle = (isDragging: boolean, position: { x: number; y: number }): React.CSSProperties => ({
  position: "fixed",
  left: position.x,
  top: position.y,
  zIndex: 1000,
  background: "#fff",
  border: "1px solid #ccc",
  borderRadius: "50%",
  width: BUTTON_SIZES.ADD_TO_HOME,
  height: BUTTON_SIZES.ADD_TO_HOME,
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

export default function AddToHomeScreenButton() {
  const { showButton, showIOSPopup, setShowButton, setShowIOSPopup } =
    useAddToHomeScreenStore();

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [browserType, setBrowserType] = useState<"safari" | "chrome" | "other">(
    "other"
  );
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Initialize position using shared utility
  useEffect(() => {
    console.log("🚀 AddToHomeScreen - Initializing position...");
    const initialPos = getInitialPosition();
    console.log("📍 AddToHomeScreen - Initial position:", initialPos);
    setPosition(initialPos);
  }, []);

  // Handle viewport changes (for Safari mobile URL bar show/hide)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      console.log("📏 AddToHomeScreen - handleResize triggered");
      const maxY = getMaxY();

      console.log("📏 AddToHomeScreen - Resize calculation:", {
        windowHeight: window.innerHeight,
        maxY,
        currentPosition: position
      });

      setPosition(prev => {
        const newY = Math.min(prev.y, maxY);
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

    const mouseX = e.clientX - dragStart.x + (BUTTON_SIZES.ADD_TO_HOME / 2); // Center adjustment
    const mouseY = e.clientY - dragStart.y + (BUTTON_SIZES.ADD_TO_HOME / 2);

    // Use shared utilities for positioning
    const newX = snapToEdge(mouseX);
    const maxY = getMaxY();
    const newY = Math.max(SPACING.VERTICAL_MARGIN, Math.min(maxY, mouseY - (BUTTON_SIZES.ADD_TO_HOME / 2)));

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
    const mouseX = touch.clientX - dragStart.x + (BUTTON_SIZES.ADD_TO_HOME / 2); // Center adjustment
    const mouseY = touch.clientY - dragStart.y + (BUTTON_SIZES.ADD_TO_HOME / 2);

    // Use shared utilities for positioning
    const newX = snapToEdge(mouseX);
    const maxY = getMaxY();
    const newY = Math.max(SPACING.VERTICAL_MARGIN, Math.min(maxY, mouseY - (BUTTON_SIZES.ADD_TO_HOME / 2)));

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