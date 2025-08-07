import React from 'react';
import { rootStyle } from "@/theme";
import InstallGuideSafariContent from './install-guides/InstallGuideSafariContent';
import InstallGuideChromeContent from './install-guides/InstallGuideChromeContent';

interface InstallGuidePopupProps {
  showPopup: boolean;
  onClose: () => void;
  title: string;
  guideType: 'safari' | 'chrome'; // Changed from url to guideType
}

export default function InstallGuidePopup({ showPopup, onClose, title, guideType }: InstallGuidePopupProps) {
  if (!showPopup) {
    return null;
  }

  const renderGuideContent = () => {
    switch (guideType) {
      case 'safari':
        return <InstallGuideSafariContent />;
      case 'chrome':
        return <InstallGuideChromeContent />;
      default:
        return null;
    }
  };

  return (
    <>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.5)",
          zIndex: 2000,
        }}
        onClick={onClose}
      />
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "80%",
        zIndex: 2001,
        background: "#fff",
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        boxShadow: "0 -4px 20px rgba(0,0,0,0.15)",
        display: "flex",
        flexDirection: "column",
        transform: showPopup ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.3s ease-out",
      }}>
        <div style={{
          padding: 16,
          borderBottom: "1px solid #eee",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <h3 style={{ margin: 0, color: rootStyle.elementColor }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 24,
              cursor: "pointer",
              color: "#666"
            }}
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        <div style={{ flexGrow: 1, overflowY: 'auto' }}>
          {renderGuideContent()}
        </div>
      </div>
    </>
  );
}
