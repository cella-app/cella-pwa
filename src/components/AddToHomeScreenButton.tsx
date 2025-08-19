/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { ArrowDownToLine } from 'lucide-react';
import InstallGuidePopup from './InstallGuidePopup';
import { useAddToHomeScreenStore } from '@/features/add-to-home-screen/stores/add-to-home-screen.store';

const buttonStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: 20,
  left: 20,
  zIndex: 1000,
  background: '#fff',
  border: '1px solid #ccc',
  borderRadius: '50%',
  width: 48,
  height: 48,
  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 24,
  cursor: 'pointer',
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

function getBrowserType(): 'safari' | 'chrome' | 'other' {
  if (typeof window === 'undefined') return 'other';
  const ua = window.navigator.userAgent.toLowerCase();

  if (/iphone|ipad|ipod/.test(ua)) {
    if (ua.includes('crios')) return 'chrome';      // iOS Chrome
    if (ua.includes('fxios')) return 'chrome';      // treat Firefox iOS also with Chrome guide
    if (ua.includes('edgios')) return 'chrome';     // Edge iOS likewise
    return 'safari';                                 // Safari
  }

  if (ua.includes('chrome') && !ua.includes('edg')) {
    return 'chrome';                                // Android Chrome
  }

  return 'other';
}

export default function AddToHomeScreenButton() {
  const {
    showButton,
    showIOSPopup,
    setShowButton,
    setShowIOSPopup,
  } = useAddToHomeScreenStore();

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [browserType, setBrowserType] = useState<'safari' | 'chrome' | 'other'>('other');

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
    if (type === 'chrome') {
      const handler = (e: any) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setShowButton(true);
      };
      window.addEventListener('beforeinstallprompt', handler);
      return () => window.removeEventListener('beforeinstallprompt', handler);
    }
  }, [setShowButton, setShowIOSPopup]);

  const handleClick = () => {
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
          console.log(choice.outcome === 'accepted'
            ? '✅ User accepted prompt'
            : '❌ User dismissed prompt');
        });
      } else {
        // fallback: mở popup Chrome guide nếu browser khác
        setShowIOSPopup(true);
      }
    }
  };

  if (!showButton) return null;

  // Trong store chỉ dùng showIOSPopup cho cả hai: safari và chrome guide
  const guideType: 'safari' | 'chrome' = browserType === 'safari' ? 'safari' : 'chrome';
  const title = guideType === 'safari'
    ? 'App Installation Guide (iOS Safari)'
    : 'App Installation Guide (Chrome)';

  return (
    <>
      <button
        onClick={handleClick}
        style={buttonStyle}
        aria-label={isIOS() ? 'Add to Home Screen Guide' : 'Install App'}
        title={isIOS() ? 'Add to Home Screen Guide' : 'Install App'}
      >
        <ArrowDownToLine size={24} />
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
