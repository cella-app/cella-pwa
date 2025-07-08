'use client';

import { reservationApi } from '../../shared/api/reservation.api';
import { userAlertStore, SERVERIFY_ALERT } from '../alert/stores/alert.store';
import { Reservation } from "@/shared/data/models/Reservation";
import { Session } from '@/shared/data/models/Session';

export async function reserveNow(workspaceId: string): Promise<Reservation> {
  const { addAlert } = userAlertStore.getState();

  try {
    const data: Reservation = await reservationApi.reserve(workspaceId);
    if (!data) throw new Error('No reservations found');

    return data;
  } catch (err) {
    addAlert({
      severity: SERVERIFY_ALERT.ERROR,
      message: err instanceof Error ? err.message : 'An unknown error occurred',
    });
    throw err;
  }
}

export async function unlockReserve(reserveId: string) {
  const { addAlert } = userAlertStore.getState();

	try {
    const data: Session = await reservationApi.unlock(reserveId);
    if (!data) throw new Error('No reservations found');

    return data;
	} catch (err) {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		//@ts-ignore
		if (400 == err?.status) {
			addAlert({
				severity: SERVERIFY_ALERT.ERROR,
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				//@ts-ignore
				message: err.message
			});
		} else {
			addAlert({
				severity: SERVERIFY_ALERT.ERROR,
				message: err instanceof Error ? err.message : 'An unknown error occurred',
			});
		}
    throw err;
  }
}

export async function cancelReserve(reserveId: string) {
  const { addAlert } = userAlertStore.getState();

	try {
    const data = await reservationApi.cancel(reserveId);
    if (!data) throw new Error('No reservations found');

    return data;
  } catch (err) {
    addAlert({
      severity: SERVERIFY_ALERT.ERROR,
      message: err instanceof Error ? err.message : 'An unknown error occurred',
    });
    throw err;
  }
}

export async function feedbackReserve(reserveId: string, star: number, content: string | null) {
  const { addAlert } = userAlertStore.getState();

  try {
    const data = await reservationApi.feeback(reserveId, star, content);
    return data;
  } catch (err) {
    addAlert({
      severity: SERVERIFY_ALERT.ERROR,
      message: err instanceof Error ? err.message : 'An unknown error occurred',
    });
    throw err;
  }
}
