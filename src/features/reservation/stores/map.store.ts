import { create } from 'zustand';
import { LocationData } from '@/shared/data/models/Location';

interface MapStore {
	currentMapCenter: LocationData | null;
	setCurrentMapCenter: (center: LocationData) => void;
}

export const useMapStore = create<MapStore>((set) => ({
	currentMapCenter: null,
	setCurrentMapCenter: (center) => set({ currentMapCenter: center }),
}));
