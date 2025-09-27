import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface EventStore {
	showButtonSearch: boolean;
	showLoader: boolean;
	changeState: (state: boolean) => void;
	changeStateShowLoader: (state: boolean) => void;
}

export const useEventStore = create<EventStore>()(
	devtools(
		(set) => ({
			showButtonSearch: false,
			showLoader: false,
			changeState: (state: boolean) => set({
				showButtonSearch: state,
			}),
			changeStateShowLoader: (state: boolean) => set({
				showLoader: state,
			}),
		}),
		{
			name: 'map-event-store',
		}
	)
);
