/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { ArrowDownToLine } from 'lucide-react';
import InstallGuidePopup from './InstallGuidePopup';
import { useAddToHomeScreenStore } from '@/features/add-to-home-screen/stores/add-to-home-screen.store';

const buttonStyle: React.CSSProperties = {
  position: "fixed",
  bottom: 20,
  right: 20,
  zIndex: 1000,
  background: "#fff",
  border: "1px solid #ccc",
  borderRadius: "50%",
  width: 48,
  height: 48,
  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 24,
  cursor: "pointer"
};

function isIOS() {
  if (typeof window === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isInStandaloneMode() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

function getBrowserType() {
  if (typeof window === 'undefined') return 'unknown';
  const userAgent = window.navigator.userAgent.toLowerCase();

  if (/iphone|ipad|ipod/i.test(userAgent)) {
    if (userAgent.includes('crios')) return 'chrome';
    if (userAgent.includes('fxios')) return 'firefox';
    if (userAgent.includes('edgios')) return 'edge';
    return 'safari';
  }

  if (userAgent.includes('chrome') && !userAgent.includes('edg')) return 'chrome';
  if (userAgent.includes('firefox')) return 'firefox';
  if (userAgent.includes('edg')) return 'edge';
  return 'other';
}

export default function AddToHomeScreenButton() {
  const {
    showButton,
    showIOSPopup,
    showChromePopup,
    showIOSIcon,
    browserType,
    setShowButton,
    setShowIOSPopup,
    setShowChromePopup,
    setShowIOSIcon,
    setBrowserType,
  } = useAddToHomeScreenStore();

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    if (isInStandaloneMode()) {
      setShowButton(false);
      setShowIOSPopup(false);
      setShowChromePopup(false);
      setShowIOSIcon(false);
      return;
    }

    const detectedBrowser = getBrowserType();
    setBrowserType(detectedBrowser);

    if (isIOS()) {
      setShowIOSIcon(true);
      setShowButton(false);
      return;
    }

    // Android: Listen for beforeinstallprompt
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowButton(true); // Show install button for Android
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [setShowButton, setShowIOSPopup, setShowChromePopup, setShowIOSIcon, setBrowserType]);

  const getInstallGuideType = (platform: 'ios' | 'chrome') => {
    if (platform === 'ios') return 'ios';
    return 'chrome';
  };

  const getPopupTitle = (platform: 'ios' | 'chrome') => {
    if (platform === 'ios') {
      switch (browserType) {
        case 'safari':
          return 'App Installation Guide (iOS Safari)';
        case 'chrome':
          return 'App Installation Guide (iOS Chrome)';
        case 'firefox':
          return 'App Installation Guide (iOS Firefox)';
        case 'edge':
          return 'App Installation Guide (iOS Edge)';
        default:
          return 'App Installation Guide (iOS)';
      }
    }
    return 'App Installation Guide (Chrome)';
  };

  const handleIOSButtonClick = () => {
    setShowIOSPopup(true);
    setShowChromePopup(false);
  };

  const handleChromeButtonClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();

      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('✅ User accepted the install prompt');
        } else {
          console.log('❌ User dismissed the install prompt');
        }
        setDeferredPrompt(null);
        setShowButton(false); // Hide button after interaction
      });
    } else {
      console.log('⚠️ No deferredPrompt available');
    }

    // Optional: show guide even after dismissed
    // setShowChromePopup(true);
    setShowIOSPopup(false);
  };

  const renderButton = () => {
    if (showIOSPopup || showChromePopup) return null;

    if (showIOSIcon) {
      return (
        <button
          onClick={handleIOSButtonClick}
          style={buttonStyle}
          aria-label="Add to Home Screen Guide"
          title="Add to Home Screen Guide"
        >
          <ArrowDownToLine size={24} />
        </button>
      );
    }

    if (showButton) {
      return (
        <button
          onClick={handleChromeButtonClick}
          style={buttonStyle}
          title="Install App"
          aria-label="Install App"
        >
          <ArrowDownToLine size={24} />
        </button>
      );
    }

    return null;
  };

  return (
    <>
      {renderButton()}

      <InstallGuidePopup
        showPopup={showIOSPopup}
        onClose={() => setShowIOSPopup(false)}
        title={getPopupTitle('ios')}
        guideType={getInstallGuideType('ios')}
      />

      <InstallGuidePopup
        showPopup={showChromePopup}
        onClose={() => setShowChromePopup(false)}
        title={getPopupTitle('chrome')}
        guideType={getInstallGuideType('chrome')}
      />
    </>
  );
}
