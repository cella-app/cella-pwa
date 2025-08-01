import { create } from 'zustand';

interface MapStore {
	currentMapCenter: { latitude: number; longitude: number } | null;
	setCurrentMapCenter: (center: { latitude: number; longitude: number }) => void;
}

export const useMapStore = create<MapStore>((set) => ({
	currentMapCenter: null,
	setCurrentMapCenter: (center) => set({ currentMapCenter: center }),
}));
