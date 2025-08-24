import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export enum MoveCenterType {
	ACTIVE = 'active',
	PASITIVE = 'pasitive'
}

interface MoveCenterTypeStore {
	type: MoveCenterType;
	setType: (type: MoveCenterType) => void;
}

export const useMoveCenterTypeStore = create<MoveCenterTypeStore>()(
	devtools(
		(set) => ({
			type: MoveCenterType.PASITIVE,
			setType: (type) => set({ type }),
		}),
		{
			name: 'move-center-type-store',
		}
	)
);
