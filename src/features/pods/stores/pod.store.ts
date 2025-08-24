// stores/location.store.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { PodList } from '@/shared/data/models/Pod';
interface PodStore {
	pods: PodList[];
	setPods: (pods: PodList[]) => void;
	clearPod: () => void;
}

export const usePodStore = create<PodStore>()(
	devtools(
		(set) => ({
			pods: [],
			setPods: (pods) => set({ pods }),
			clearPod: () => set({ pods: [] }),
		}),
		{
			name: 'pod-store',
		}
	)
);