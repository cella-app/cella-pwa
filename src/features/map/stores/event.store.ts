import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface EventStore {
	showButtonSearch: boolean;
	changeState: (state: boolean) => void;
	isPodUnlocked: boolean;
	setPodUnlocked: (state: boolean) => void;
}

export const useEventStore = create<EventStore>()(
	devtools(
		(set) => ({
			showButtonSearch: false,
			changeState: (state: boolean) => set({ showButtonSearch: state }),
			isPodUnlocked: false,
			setPodUnlocked: (state: boolean) => set({ isPodUnlocked: state }),
		}),
		{
			name: 'map-event-store',
		}
	)
);
