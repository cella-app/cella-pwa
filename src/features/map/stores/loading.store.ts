import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface LoadingStore {
	loading: boolean;
	setLoading: (state: boolean) => void;
}

export const useLoadingStore = create<LoadingStore>()(
	devtools(
		(set) => ({
			loading: false,
			setLoading: (state: boolean) => set({ loading: state }),
		}),
		{
			name: 'pod-loading-store',
		}
	)
);
