"use client";

import { createContext, useContext, useState, ReactNode } from 'react';

interface WorkspacePopupContextType {
  isPopupOpen: boolean;
  popupHeight: number;
  setPopupOpen: (open: boolean) => void;
  setPopupHeight: (height: number) => void;
}

const WorkspacePopupContext = createContext<WorkspacePopupContextType | undefined>(undefined);

export function WorkspacePopupProvider({ children }: { children: ReactNode }) {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupHeight, setPopupHeight] = useState(0);

  const setPopupOpen = (open: boolean) => {
    setIsPopupOpen(open);
    if (!open) {
      setPopupHeight(0);
    }
  };

  return (
    <WorkspacePopupContext.Provider
      value={{
        isPopupOpen,
        popupHeight,
        setPopupOpen,
        setPopupHeight,
      }}
    >
      {children}
    </WorkspacePopupContext.Provider>
  );
}

export function useWorkspacePopup() {
  const context = useContext(WorkspacePopupContext);
  if (context === undefined) {
    throw new Error('useWorkspacePopup must be used within a WorkspacePopupProvider');
  }
  return context;
}