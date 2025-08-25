import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { User } from '@/shared/data/models/User';
import { getToken, getRefreshToken, getUser, setToken, setRefreshToken, setUser } from '@/shared/utils/auth';

interface AuthState {
	user: User | null | undefined;
	refreshToken: string | null;
	token: string | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	error: string | null;

	// Sync actions
	setAuth: (refreshToken: string | null, token: string | null) => void;
	setUser: (user: User | null) => void;
	logout: () => void;
	setLoading: (loading: boolean) => void;
	setError: (error: string | null) => void;
	initializeAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
	devtools(
		(set) => ({
			refreshToken: null,
			token: null,
			isAuthenticated: false,
			isLoading: true,
			error: null,
			user: null,

			setUser: (user) => {
				setUser(user);
				set({
					user
				})
			},

			setAuth: (refreshToken, token) => {
				setRefreshToken(refreshToken);
				setToken(token);
				set({
					refreshToken,
					token,
					isAuthenticated: !!refreshToken && !!token,
					isLoading: false,
					error: null,
				})
			},

			logout: () => {
				setRefreshToken(null);
				setToken(null);
				setUser(null);

				set({
					refreshToken: null,
					token: null,
					user: null,
					isAuthenticated: false,
					error: null,
					isLoading: false,
				})
			},

			setLoading: (loading) => set({ isLoading: loading }),
			setError: (error) => set({ error }),

			initializeAuth: () => {
				if (typeof window !== 'undefined') {
					try {
						const token = getToken();
						const refreshToken = getRefreshToken();
						const user = getUser();

						if (token && refreshToken) {
							set({
								token,
								refreshToken,
								user,
								isAuthenticated: true,
								isLoading: false,
								error: null,
							});
							console.log('[auth] Initialized isAuthenticated:', true);
						} else {
							set({
								token: null,
								refreshToken: null,
								user: null,
								isAuthenticated: false,
								isLoading: false,
								error: null,
							});
							console.log('[auth] Initialized isAuthenticated:',  false);
						}
					} catch (error) {
						console.error('Error initializing auth:', error);
						set({
							token: null,
							refreshToken: null,
							user: null,
							isAuthenticated: false,
							isLoading: false,
							error: 'Failed to initialize authentication',
						});
					}
				} else {
					set({
						isLoading: false,
					});
					console.warn('[auth] Window not found' );
				}
			},
		}),
		{ name: 'auth-store' }
	)
);