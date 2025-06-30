import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Reservation } from '@/shared/data/models/Reservation';
import { reservationApi } from '@/shared/api/reservation.api';

interface ReservationState {
	current: Reservation | null;
	isChecking: boolean;
	error: string | null;

	checkReservation: () => Promise<void>;
	setReservation: (reservation: Reservation | null) => void;
	clearReservation: () => void;
}

export const useReservationStore = create<ReservationState>()(
	devtools(
		(set) => ({
			current: null,
			isChecking: false,
			error: null,

			setReservation: (reservation) => {
				if (typeof window !== 'undefined') {
					if (reservation) {
						localStorage.setItem('current_reservation', JSON.stringify(reservation));
					} else {
						localStorage.removeItem('current_reservation');
					}
				}
				set({ current: reservation });
			},

			clearReservation: () => {
				if (typeof window !== 'undefined') {
					localStorage.removeItem('current_reservation');
				}
				set({ current: null });
			},

			checkReservation: async () => {
				set({ isChecking: true, error: null });

				try {
					if (typeof window !== 'undefined') {
						const cached = localStorage.getItem('current_reservation');
						if (cached) {
							const parsed = JSON.parse(cached);
							set({ current: parsed });
						}
					}

					const fetched = await reservationApi.getCurrentReserve();
					if (fetched && fetched.id) {
						set({ current: fetched });
						localStorage.setItem('current_reservation', JSON.stringify(fetched));
					} else {
						set({ current: null });
						localStorage.removeItem('current_reservation');
					}
				} catch (err) {
					console.error('checkReservation error:', err);
					set({
						current: null,
						error: 'Không thể kiểm tra đặt chỗ hiện tại',
					});
					localStorage.removeItem('current_reservation');
				} finally {
					set({ isChecking: false });
				}
			}
		}),
		{ name: 'reservation-store' }
	)
);
