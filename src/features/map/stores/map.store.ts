import { create } from 'zustand';
import { LocationData } from '@/shared/data/models/Location';

interface MapStore {
	currentMapCenter: LocationData | null;
	lastMapCenter: LocationData | null;
	setCurrentMapCenter: (center: LocationData) => void;
	setLastMapCenter: (center: LocationData) => void;
}

export const useMapStore = create<MapStore>((set) => ({
	currentMapCenter: null,
	lastMapCenter: null,
	setCurrentMapCenter: (center) => set({ currentMapCenter: center }),
	setLastMapCenter: (center) => set({ lastMapCenter: center }),
}));
