// stores/location.store.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface MapConditionStore {
	locationDiffValid: boolean;
	centerAndlocationDiffValid: boolean;
	setStateLocationDiffValid: (valid: boolean) => void;
	setStateCenterAndlocationDiffValid: (valid: boolean) => void;
}

export const useMapConditionStore = create<MapConditionStore>()(
	devtools(
		(set) => ({
			locationDiffValid: true,
			centerAndlocationDiffValid: false,
			setStateLocationDiffValid: (valid) => set({ locationDiffValid: valid }),
			setStateCenterAndlocationDiffValid: (valid) => set({ centerAndlocationDiffValid: valid }),
		}),
		{
			name: 'map-condition-store',
		}
	)
);