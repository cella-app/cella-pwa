// stores/location.store.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface LocationStore {
	currentLocation: [number, number] | null; // [latitude, longitude]
	setLocation: (location: [number, number] | null) => void;
	clearLocation: () => void;
}

export const useLocationStore = create<LocationStore>()(
	devtools(
		(set) => ({
			currentLocation: null,
			setLocation: (location) => set({ currentLocation: location }),
			clearLocation: () => set({ currentLocation: null }),
		}),
		{
			name: 'location-store',
		}
	)
);