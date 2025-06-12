import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export enum SERVERIFY_ALERT {
	ERROR = "error",
	SUCCESS = "success",
	INFO = "info",
	WARNING = "warning"
}

export interface AlertState {
	severity: SERVERIFY_ALERT;
	message: string;
}

interface AlertStore {
	alerts: AlertState[];
	addAlert: (alert: AlertState) => void;
	removeAlert: (index: number) => void;
	clearAlerts: () => void;
}

export const userAlertStore = create<AlertStore>()(
	devtools(
		(set) => ({
			alerts: [],
			addAlert: (alert) =>
				set((state) => ({ alerts: [...state.alerts, alert] })),
			removeAlert: (index) =>
				set((state) => ({
					alerts: state.alerts.filter((_, i) => i !== index)
				})),
			clearAlerts: () => set({ alerts: [] })
		}),
		{
			name: "alert-store"
		}
	)
);
