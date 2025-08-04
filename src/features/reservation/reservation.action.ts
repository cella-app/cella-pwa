'use client';

import { reservationApi } from '../../shared/api/reservation.api';
import { Reservation } from "@/shared/data/models/Reservation";
import { Session } from '@/shared/data/models/Session';
import { alertError } from '@/shared/utils/error';


export async function reserveNow(workspaceId: string): Promise<Reservation> {

  try {
    const data: Reservation = await reservationApi.reserve(workspaceId);
    if (!data) throw new Error('No reservations found');

    return data;
  } catch (err) {
    alertError(err)
    throw err;
  }
}

export async function unlockReserve(reserveId: string) {

	try {
    const data: Session = await reservationApi.unlock(reserveId);
    if (!data) throw new Error('No reservations found');

    return data;
	} catch (err) {
    alertError(err)
    throw err;
  }
}

export async function cancelReserve(reserveId: string) {
	try {
    const data = await reservationApi.cancel(reserveId);
    if (!data) throw new Error('No reservations found');

    return data;
  } catch (err) {
    alertError(err)
    throw err;
  }
}

export async function feedbackReserve(reserveId: string, star: number, content: string | null) {

  try {
    const data = await reservationApi.feeback(reserveId, star, content);
    return data;
  } catch (err) {
    alertError(err)
    throw err;
  }
}
