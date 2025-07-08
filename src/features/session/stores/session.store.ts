import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Session, SessionPause } from '@/shared/data/models/Session';
import { sessionApi } from '@/shared/api/session.api';

interface SessionState {
	current: Session | null;
	currentPause: SessionPause | null;
	pauseLogs: SessionPause[];
	isChecking: boolean;
	error: string | null;

	checkSession: () => Promise<void>;
	setSession: (session: Session | null) => void;
	clearSession: () => void;
	setCurrentPause: (pause: SessionPause | null) => void;
	setPauseLogs: (logs: SessionPause[]) => void;
	addPauseLog: (pause: SessionPause) => void;
	loadPauseLogs: (sessionId: string) => Promise<void>;
	loadCurrentPause: (sessionId: string) => Promise<void>;
}

export const useSessionStore = create<SessionState>()(
	devtools(
		(set, get) => ({
			current: null,
			currentPause: null,
			pauseLogs: [],
			isChecking: false,
			error: null,

			setSession: (session) => {
				set({ current: session });
			},

			clearSession: () => {
				set({ current: null, currentPause: null, pauseLogs: [] });
			},

			setCurrentPause: (pause) => {
				set({ currentPause: pause });
			},

			setPauseLogs: (logs) => {
				set({ pauseLogs: logs });
			},

			addPauseLog: (pause) => {
				const { pauseLogs } = get();
				const newLogs = [...pauseLogs, pause];
				set({ pauseLogs: newLogs });
			},

			loadPauseLogs: async (sessionId: string) => {
				try {
					const logs = await sessionApi.getPauseLogs(sessionId);
					const { setPauseLogs } = get();
					setPauseLogs(logs);
				} catch (err) {
					console.error('loadPauseLogs error:', err);
					const { setPauseLogs } = get();
					setPauseLogs([]);
				}
			},

			loadCurrentPause: async (sessionId: string) => {
				try {
					const pause = await sessionApi.getCurrentPause(sessionId);
					const { setCurrentPause } = get();
					setCurrentPause(pause);
				} catch (err) {
					console.error('loadCurrentPause error:', err);
					const { setCurrentPause } = get();
					setCurrentPause(null);
				}
			},

			checkSession: async () => {
				set({ isChecking: true, error: null });

				try {
					const session = await sessionApi.getCurrentRunningSession();
					if (session && session.id) {
						set({ current: session });
					} else {
						set({ current: null });
					}
				} catch (err) {
					console.error('checkSession error:', err);
					set({
						current: null,
						error: 'Cannot checking',
					});
				} finally {
					set({ isChecking: false });
				}
			}
		}),
		{ name: 'session-store' }
	)
);
