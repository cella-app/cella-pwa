// stores/location.store.ts
import { LocationData } from '@/shared/data/models/Location';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface LocationStore {
	currentLocation: LocationData | null;
	lastLocation: LocationData | null;
	setLocation: (location: LocationData | null) => void;
	setLastLocation: (location: LocationData | null) => void;
	clearLocation: () => void;
}

export const useLocationStore = create<LocationStore>()(
	devtools(
		(set) => ({
			currentLocation: null,
			lastLocation: null,
			setLocation: (location) => set({ currentLocation: location }),
			setLastLocation: (location) => set({lastLocation: location}),
			clearLocation: () => set({ currentLocation: null, lastLocation: null }),
		}),
		{
			name: 'location-store',
		}
	)
);