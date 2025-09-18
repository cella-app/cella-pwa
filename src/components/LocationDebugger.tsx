/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { getEnvironmentInfo, getBottomOffset, getBottomOffsetPixels, getInitialPosition, getMaxY, BUTTON_SIZES } from "@/shared/utils/positioning";

interface DebugInfo {
  windowHeight: number;
  windowWidth: number;
  bottomOffsetPt: string;
  bottomOffsetPx: number;
  addToHomeY: number;
  maxY: number;
  environment: {
    isSafari: boolean;
    isIOS: boolean;
    isStandalone: boolean;
  };
  userAgent: string;
  devicePixelRatio: number;
}

export default function MobileDebugger() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const updateDebugInfo = () => {
    if (typeof window === "undefined") return;

    const env = getEnvironmentInfo();
    const bottomOffsetPt = getBottomOffset(env.isSafari, env.isIOS, env.isStandalone);
    const bottomOffsetPx = getBottomOffsetPixels();
    const initialPos = getInitialPosition();
    const maxY = getMaxY();

    setDebugInfo({
      windowHeight: window.innerHeight,
      windowWidth: window.innerWidth,
      bottomOffsetPt,
      bottomOffsetPx,
      addToHomeY: initialPos.y,
      maxY,
      environment: env,
      userAgent: navigator.userAgent,
      devicePixelRatio: window.devicePixelRatio || 1
    });
  };

  useEffect(() => {
    updateDebugInfo();
    
    const handleResize = () => {
      setTimeout(updateDebugInfo, 100);
    };

    window.addEventListener('resize', handleResize);
    
    // Listen for visual viewport changes
    const visualViewport = (window as any).visualViewport;
    if (visualViewport) {
      visualViewport.addEventListener('resize', handleResize);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (visualViewport) {
        visualViewport.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  if (!debugInfo) return null;

  // Calculate LocateControl position for comparison
  const locateControlY = debugInfo.windowHeight - debugInfo.bottomOffsetPx;
  const yDifference = Math.abs(debugInfo.addToHomeY - locateControlY);

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        style={{
          position: 'fixed',
          top: 10,
          left: 10,
          zIndex: 10001,
          background: '#007AFF',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          padding: '8px 12px',
          fontSize: '12px',
          fontWeight: 'bold'
        }}
      >
        🐛 DEBUG
      </button>

      {/* Debug overlay */}
      {isVisible && (
        <div
          style={{
            position: 'fixed',
            top: 50,
            left: 10,
            right: 10,
            background: 'rgba(0,0,0,0.9)',
            color: 'white',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '11px',
            fontFamily: 'monospace',
            zIndex: 10000,
            maxHeight: '70vh',
            overflow: 'auto',
            lineHeight: '1.4'
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#00FF00' }}>
            📱 MOBILE DEBUG INFO
          </div>

          <div style={{ marginBottom: '8px' }}>
            <strong style={{ color: '#FFD700' }}>📏 Window:</strong><br />
            Size: {debugInfo.windowWidth} × {debugInfo.windowHeight}px<br />
            DPR: {debugInfo.devicePixelRatio}
          </div>

          <div style={{ marginBottom: '8px' }}>
            <strong style={{ color: '#FFD700' }}>🌐 Environment:</strong><br />
            iOS: {debugInfo.environment.isIOS ? '✅' : '❌'}<br />
            Safari: {debugInfo.environment.isSafari ? '✅' : '❌'}<br />
            PWA: {debugInfo.environment.isStandalone ? '✅' : '❌'}
          </div>

          <div style={{ marginBottom: '8px' }}>
            <strong style={{ color: '#FFD700' }}>📍 Bottom Offset:</strong><br />
            PT Value: {debugInfo.bottomOffsetPt}<br />
            PX Value: {debugInfo.bottomOffsetPx}px<br />
            Ratio: {(debugInfo.bottomOffsetPx / parseFloat(debugInfo.bottomOffsetPt)).toFixed(2)}px/pt
          </div>

          <div style={{ marginBottom: '8px' }}>
            <strong style={{ color: yDifference <= 2 ? '#00FF00' : '#FF4444' }}>
              🎯 Button Positions:
            </strong><br />
            AddToHome Y: {debugInfo.addToHomeY}px<br />
            LocateControl Y: {locateControlY}px<br />
            <span style={{ color: yDifference <= 2 ? '#00FF00' : '#FF4444' }}>
              Difference: {yDifference.toFixed(1)}px {yDifference <= 2 ? '✅ ALIGNED' : '❌ MISALIGNED'}
            </span>
          </div>

          <div style={{ marginBottom: '8px' }}>
            <strong style={{ color: '#FFD700' }}>⚙️ Button Sizes:</strong><br />
            AddToHome: {BUTTON_SIZES.ADD_TO_HOME}px<br />
            LocateControl: {BUTTON_SIZES.LOCATE_CONTROL}px
          </div>

          <div style={{ fontSize: '10px', color: '#888', wordBreak: 'break-all' }}>
            UA: {debugInfo.userAgent}
          </div>
        </div>
      )}

      {/* Visual alignment helpers */}
      {isVisible && (
        <>
          {/* AddToHome position indicator */}
          <div
            style={{
              position: 'fixed',
              left: debugInfo.windowWidth - 100,
              top: debugInfo.addToHomeY,
              width: '80px',
              height: BUTTON_SIZES.ADD_TO_HOME,
              border: '2px solid #00FF00',
              borderRadius: '50%',
              pointerEvents: 'none',
              zIndex: 999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              color: '#00FF00',
              background: 'rgba(0,255,0,0.1)'
            }}
          >
            ADD
          </div>

          {/* LocateControl position indicator */}
          <div
            style={{
              position: 'fixed',
              right: 16,
              bottom: debugInfo.bottomOffsetPt,
              width: BUTTON_SIZES.LOCATE_CONTROL,
              height: BUTTON_SIZES.LOCATE_CONTROL,
              border: '2px solid #FF4444',
              borderRadius: '4px',
              pointerEvents: 'none',
              zIndex: 999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              color: '#FF4444',
              background: 'rgba(255,68,68,0.1)'
            }}
          >
            LOC
          </div>
        </>
      )}
    </>
  );
}