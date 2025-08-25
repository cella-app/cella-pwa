import { create } from 'zustand';

interface TrackingModeState {
  isTrackingModeActive: boolean;
  setTrackingMode: (active: boolean) => void;
}

export const useTrackingModeStore = create<TrackingModeState>((set) => ({
  isTrackingModeActive: false, // Default to false, user controls map
  setTrackingMode: (active: boolean) => set({ isTrackingModeActive: active }),
}));
