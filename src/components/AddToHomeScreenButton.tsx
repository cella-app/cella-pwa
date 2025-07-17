/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from "react";

function isIOS() {
  if (typeof window === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isInStandaloneMode() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
}

export default function AddToHomeScreenButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showButton, setShowButton] = useState(false);
  // const [showIOSPopup, setShowIOSPopup] = useState(false);
  // const [showIOSIcon, setShowIOSIcon] = useState(false);

  useEffect(() => {
    if (isInStandaloneMode()) {
      setShowButton(false);
      // setShowIOSPopup(false);
      // setShowIOSIcon(false);
      return;
    }
    if (isIOS()) {
      // setShowIOSIcon(true);
      setShowButton(false);
      return;
    }
    // Android/Chrome
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowButton(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.finally(() => {
        setShowButton(false);
      });
    }
  };

  // iOS: Hiện icon nhỏ, bấm vào mở popup hướng dẫn
  // if (showIOSIcon) {
  //   return (
  //     <>
  //       <button
  //         onClick={() => setShowIOSPopup(true)}
  //         style={{
  //           position: "fixed",
  //           bottom: 20,
  //           right: 20,
  //           zIndex: 1000,
  //           background: "#fff",
  //           border: "1px solid #ccc",
  //           borderRadius: "50%",
  //           width: 48,
  //           height: 48,
  //           boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
  //           display: "flex",
  //           alignItems: "center",
  //           justifyContent: "center",
  //           fontSize: 24,
  //         }}
  //         aria-label="Add to Home Screen Guide"
  //       >
  //         &#x1f5d2;
  //       </button>
  //       {showIOSPopup && (
  //         <div
  //           style={{
  //             position: "fixed",
  //             bottom: 80,
  //             right: 20,
  //             left: 20,
  //             zIndex: 1001,
  //             background: "#fff",
  //             border: "1px solid #ccc",
  //             borderRadius: 8,
  //             padding: 16,
  //             boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
  //           }}
  //         >
  //           <b>How to add to Home Screen (iOS):</b>
  //           <ol style={{ margin: "8px 0 0 16px" }}>
  //             <li>
  //               Tap the <b>Share</b> button{" "}
  //               <span role="img" aria-label="share">
  //                 &#x1f5d2;
  //               </span>{" "}
  //               in the browser.
  //             </li>
  //             <li>Select <b>Add to Home Screen</b>.</li>
  //           </ol>
  //           <button style={{ marginTop: 8 }} onClick={() => setShowIOSPopup(false)}>
  //             Close
  //           </button>
  //         </div>
  //       )}
  //     </>
  //   );
  // }


  // Android/Chrome: Hiện button khi có beforeinstallprompt
  if (showButton) {
    return (
      <button onClick={handleClick} style={{ position: "fixed", bottom: 20, right: 20, zIndex: 1000 }}>
        Add to Home screen
      </button>
    );
  }

  // Standalone hoặc không đủ điều kiện: không hiển thị gì
  return null;
} 