// stores/location.store.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface SearchCenterStore {
	currentCenter: [number, number] | null;
	setCenter: (location: [number, number] | null) => void;
	clearCenter: () => void;
}

export const useSearchCenterStore = create<SearchCenterStore>()(
	devtools(
		(set) => ({
			currentCenter: null,
			setCenter: (location) => set({ currentCenter: location }),
			clearCenter: () => set({ currentCenter: null }),
		}),
		{
			name: 'search-center-store',
		}
	)
);