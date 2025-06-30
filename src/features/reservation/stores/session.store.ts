import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Session } from '@/shared/data/models/Session';
import { sessionApi } from '@/shared/api/session.api';

interface SessionState {
	current: Session | null;
	isChecking: boolean;
	error: string | null;

	checkSession: () => Promise<void>;
	setSession: (session: Session | null) => void;
	clearSession: () => void;
}

export const useSessionStore = create<SessionState>()(
	devtools(
		(set) => ({
			current: null,
			isChecking: false,
			error: null,

			setSession: (session) => {
				if (typeof window !== 'undefined') {
					if (session) {
						localStorage.setItem('current_session', JSON.stringify(session));
					} else {
						localStorage.removeItem('current_session');
					}
				}
				set({ current: session });
			},

			clearSession: () => {
				if (typeof window !== 'undefined') {
					localStorage.removeItem('current_session');
				}
				set({ current: null });
			},

			checkSession: async () => {
				set({ isChecking: true, error: null });

				try {
					// 1. Đọc từ localStorage nếu có
					if (typeof window !== 'undefined') {
						const cached = localStorage.getItem('current_session');
						if (cached) {
							const parsed = JSON.parse(cached);
							set({ current: parsed });
						}
					}

					// 2. Gọi API thật để đồng bộ lại
					const session = await sessionApi.getCurrentRunningSession();
					if (session && session.id) {
						set({ current: session });
						localStorage.setItem('current_session', JSON.stringify(session));
					} else {
						set({ current: null });
						localStorage.removeItem('current_session');
					}
				} catch (err) {
					console.error('checkSession error:', err);
					set({
						current: null,
						error: 'Không thể kiểm tra phiên sử dụng hiện tại',
					});
					localStorage.removeItem('current_session');
				} finally {
					set({ isChecking: false });
				}
			}
		}),
		{ name: 'session-store' }
	)
);
