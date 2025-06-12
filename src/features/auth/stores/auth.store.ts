// auth.store.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { User } from '@/shared/data/models/User';

interface AuthState {
	user: User | null;
	token: string | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	error: string | null;

	// Sync actions
	setAuth: (user: User, token: string) => void;
	logout: () => void;
	setLoading: (loading: boolean) => void;
	setError: (error: string | null) => void;
	initializeAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
	devtools(
		(set) => ({
			user: null,
			token: null,
			isAuthenticated: false,
			isLoading: false,
			error: null,

			setAuth: (user, token) =>
				set({
					user,
					token,
					isAuthenticated: true,
					isLoading: false,
					error: null,
				}),

			logout: () =>
				set({
					user: null,
					token: null,
					isAuthenticated: false,
					error: null,
				}),

			setLoading: (loading) => set({ isLoading: loading }),
			setError: (error) => set({ error }),

			initializeAuth: () => {
				if (typeof window !== 'undefined') {
					const token = localStorage.getItem('token');
					const user = localStorage.getItem('user');
					if (token && user) {
						set({
							token,
							user: JSON.parse(user),
							isAuthenticated: true,
						});
					}
				}
			},
		}),
		{ name: 'auth-store' }
	)
);
