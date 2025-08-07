import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface AddToHomeScreenState {
  showButton: boolean;
  showIOSPopup: boolean;
  showChromePopup: boolean;
  showIOSIcon: boolean;
  browserType: string;

  setShowButton: (show: boolean) => void;
  setShowIOSPopup: (show: boolean) => void;
  setShowChromePopup: (show: boolean) => void;
  setShowIOSIcon: (show: boolean) => void;
  setBrowserType: (type: string) => void;
  resetPopups: () => void;
}

export const useAddToHomeScreenStore = create<AddToHomeScreenState>()(
  devtools(
    (set) => ({
      showButton: false,
      showIOSPopup: false,
      showChromePopup: false,
      showIOSIcon: false,
      browserType: 'unknown',

      setShowButton: (show) => set({ showButton: show }),
      setShowIOSPopup: (show) => set({ showIOSPopup: show }),
      setShowChromePopup: (show) => set({ showChromePopup: show }),
      setShowIOSIcon: (show) => set({ showIOSIcon: show }),
      setBrowserType: (type) => set({ browserType: type }),
      resetPopups: () => set({ showIOSPopup: false, showChromePopup: false }),
    }),
    { name: 'add-to-home-screen-store' }
  )
);
