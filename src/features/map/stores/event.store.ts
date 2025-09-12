import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface EventStore {
	showButtonSearch: boolean;
	changeState: (state: boolean) => void;
}

export const useEventStore = create<EventStore>()(
	devtools(
		(set) => ({
			showButtonSearch: false,
			changeState: (state: boolean) => set({ showButtonSearch: state }),
		}),
		{
			name: 'map-event-store',
		}
	)
);
