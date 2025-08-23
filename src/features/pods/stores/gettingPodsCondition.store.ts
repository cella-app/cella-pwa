//stores/condition.store.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface GettingPodsCondition {
	state: boolean;
	changeState: (state: boolean) => void;
	setDefault: () => void
}


export const useGettingPodsConditionStore = create<GettingPodsCondition>()(
	devtools(
		(set) => ({
			state: false,
			changeState: (state) => set({ state }),
			setDefault: () => set({ state: false }),
		}),
		{
			name: 'getting-pods-condition-store',
		}
	)
);