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
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isInStandaloneMode() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

function getBrowserType(): "safari" | "chrome" | "other" {
  if (typeof window === "undefined") return "other";
  const ua = window.navigator.userAgent.toLowerCase();

  if (/iphone|ipad|ipod/.test(ua)) {
    if (ua.includes("crios")) return "chrome"; // iOS Chrome
    if (ua.includes("fxios")) return "chrome"; // treat Firefox iOS also with Chrome guide
    if (ua.includes("edgios")) return "chrome"; // Edge iOS likewise
    return "safari"; // Safari
  }

  if (ua.includes("chrome") && !ua.includes("edg")) {
    return "chrome"; // Android Chrome
  }

  return "other";
}

// Helper function to get safe area height
function getSafeViewportHeight(): number {
  if (typeof window === "undefined") return 0;

  // For PWA or standalone mode, use full viewport
  if (isInStandaloneMode()) {
    return window.innerHeight;
  }

  // For iOS Safari mobile, account for bottom URL bar
  if (isIOS() && getBrowserType() === "safari") {
    // Use visualViewport if available, fallback to innerHeight
    const visualViewport = (window as any).visualViewport;
    if (visualViewport) {
      return visualViewport.height;
    }
    // Conservative fallback: subtract estimated Safari UI height
    return window.innerHeight - 44; // Safari bottom bar height
  }

  // For other browsers (Chrome, etc.), use full height
  return window.innerHeight;
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

  // Initialize position based on environment
  useEffect(() => {
    if (typeof window !== "undefined") {
      const safeHeight = getSafeViewportHeight();
      setPosition({ x: 20, y: safeHeight - 68 });
    }
  }, []);

  // Handle viewport changes (for Safari mobile URL bar show/hide)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      const safeHeight = getSafeViewportHeight();
      setPosition(prev => ({
        ...prev,
        y: Math.min(prev.y, safeHeight - 68) // Adjust if current position is too low
      }));
    };

    // Listen for visual viewport changes (iOS Safari)
    const visualViewport = (window as any).visualViewport;
    if (visualViewport) {
      visualViewport.addEventListener('resize', handleResize);
    }

    // Fallback for regular window resize
    window.addEventListener('resize', handleResize);

    return () => {
      if (visualViewport) {
        visualViewport.removeEventListener('resize', handleResize);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (isInStandaloneMode()) {
      setShowButton(false);
      setShowIOSPopup(false);
      return;
    }

    const type = getBrowserType();
    setBrowserType(type);

    if (isIOS()) {
      // iOS (Safari & other WebKit browsers): show button to open popup
      setShowButton(true);
      return;
    }

    // Android Chrome: listen for PWA prompt
    if (type === "chrome") {
      const handler = (e: any) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setShowButton(true);
      };
      window.addEventListener("beforeinstallprompt", handler);
      return () => window.removeEventListener("beforeinstallprompt", handler);
    }
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
    const safeHeight = getSafeViewportHeight();
    const newY = Math.max(20, Math.min(safeHeight - 68, mouseY - 24));

    let newX;
    if (mouseX < centerX) {
      // Snap to left edge
      newX = 20;
    } else {
      // Snap to right edge
      newX = window.innerWidth - 68;
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
    const safeHeight = getSafeViewportHeight();
    const newY = Math.max(20, Math.min(safeHeight - 68, mouseY - 24));

    let newX;
    if (mouseX < centerX) {
      // Snap to left edge
      newX = 20;
    } else {
      // Snap to right edge
      newX = window.innerWidth - 68;
    }

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
    if (isIOS()) {
      // iOS: luôn mở popup với guideType dựa trên browserType
      setShowIOSPopup(true);
    } else {
      // Android
      if (deferredPrompt) {
        // Chrome PWA
        deferredPrompt.prompt();
        deferredPrompt.userChoice.finally((choice: any) => {
          setDeferredPrompt(null);
          setShowButton(false);
          console.log(
            choice?.outcome === "accepted"
              ? "✅ User accepted prompt"
              : "❌ User dismissed prompt"
          );
        });
      } else {
        // fallback: mở popup Chrome guide nếu browser khác
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