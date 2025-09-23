import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface RadiusStore {
	radius: number;
	setRadius: (radius: number) => void;
}

export const useRadiusStore = create<RadiusStore>()(
	devtools(
		(set) => ({
			radius: 1200, // Doubled from 600 to 1200
			setRadius: (radius) => set({ radius }),
		}),
		{
			name: 'radius-store',
		}
	)
);
