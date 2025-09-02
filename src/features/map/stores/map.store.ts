import { create } from 'zustand';
import { LocationData } from '@/shared/data/models/Location';
import L from 'leaflet';

interface MapStore {
	currentMapCenter: LocationData | null;
	lastMapCenter: LocationData | null;
	map: L.Map | null; // Add map instance
	setCurrentMapCenter: (center: LocationData) => void;
	setLastMapCenter: (center: LocationData) => void;
	setMap: (map: L.Map) => void; // Add setMap function
}

export const useMapStore = create<MapStore>((set) => ({
	currentMapCenter: null,
	lastMapCenter: null,
	map: null, // Initialize map to null
	setCurrentMapCenter: (center) => set({ currentMapCenter: center }),
	setLastMapCenter: (center) => set({ lastMapCenter: center }),
	setMap: (map) => set({ map }), // Set map instance
}));
