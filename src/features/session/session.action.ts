/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { sessionApi } from '../../shared/api/session.api';
import { Session } from '@/shared/data/models/Session';
import { useSessionStore } from './stores/session.store';
import { alertError } from '@/shared/utils/error';

export async function tracking(sessionId: string) {
  const { current, setSession } = useSessionStore.getState();

  try {
    await sessionApi.trackingSession(sessionId);
    if (current) {
      const trackingSession: Session = { ...current, latest_tracking: new Date() };
      setSession(trackingSession)
    }
  
  } catch (err) {
    alertError(err)
    throw err;
  }
}

export async function pause(sessionId: string) {
  const { setSession } = useSessionStore.getState();

  try {
    const pausedSession: Session = await sessionApi.pauseSession(sessionId);
    setSession(pausedSession)

  } catch (err) {
    alertError(err)
    throw err;
  }
}

export async function resume(sessionId: string) {
  const { setSession } = useSessionStore.getState();

  try {
    const resumedSession: Session = await sessionApi.resumeSession(sessionId);
    setSession(resumedSession)

  } catch (err) {
    alertError(err)
    throw err;
  }
}

export async function end(sessionId: string) {
  const { setSession } = useSessionStore.getState();

  try {
    const endedSession: Session = await sessionApi.endSession(sessionId);
    setSession(endedSession);

  } catch (err) {
    alertError(err)
    throw err;
  }
}

export async function checkout(sessionId: string) {
  const { clearSession } = useSessionStore.getState();
  try {
    await sessionApi.endSession(sessionId);
    clearSession();

  } catch (err) {
    alertError(err)
    throw err;
  }
}

export async function getAmount(sessionId: string): Promise<{ amount: number }> {
  try {
    const amount = await sessionApi.getAmount(sessionId);
    if (amount === null) {
      throw new Error("Failed to retrieve amount.");
    }
    return { amount };
  } catch (err) {
    alertError(err);
    throw err;
  }
}
