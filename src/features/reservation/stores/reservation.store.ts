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
				set({ current: reservation });
			},

			clearReservation: () => {
				set({ current: null });
			},

			checkReservation: async () => {
				set({ isChecking: true, error: null });

				try {
					const fetched = await reservationApi.getCurrentReserve();
					if (fetched && fetched.id) {
						set({ current: fetched });
					} else {
						set({ current: null });
					}
				} catch (err) {
					console.error('checkReservation error:', err);
					set({
						current: null,
						error: 'Không thể kiểm tra đặt chỗ hiện tại',
					});
				} finally {
					set({ isChecking: false });
				}
			}
		}),
		{ name: 'reservation-store' }
	)
);
