/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { sessionApi } from '../../shared/api/session.api';
import { userAlertStore, SERVERIFY_ALERT } from '../alert/stores/alert.store';
import { Session, SessionStatusEnum } from '@/shared/data/models/Session';
import { useSessionStore } from './stores/session.store';

export async function tracking(sessionId: string) {
  const { addAlert } = userAlertStore.getState();
  const { current, setSession } = useSessionStore.getState();

  try {
    await sessionApi.trackingSession(sessionId);
    if (current) {
      const trackingSession: Session = { ...current, latest_tracking: new Date() };
      setSession(trackingSession)
    }
  
  } catch (err) {
    addAlert({
      severity: SERVERIFY_ALERT.ERROR,
      message: err instanceof Error ? err.message : 'An unknown error occurred',
    });
    throw err;
  }
}

export async function pause(sessionId: string) {
  const { addAlert } = userAlertStore.getState();
  const { setSession } = useSessionStore.getState();

  try {
    const pausedSession: Session = await sessionApi.pauseSession(sessionId);
    setSession(pausedSession)

  } catch (err) {
    addAlert({
      severity: SERVERIFY_ALERT.ERROR,
      message: err instanceof Error ? err.message : 'An unknown error occurred',
    });
    throw err;
  }
}

export async function resume(sessionId: string) {
  const { addAlert } = userAlertStore.getState();
  const { setSession } = useSessionStore.getState();

  try {
    const resumedSession: Session = await sessionApi.resumeSession(sessionId);
    setSession(resumedSession)

  } catch (err) {
    addAlert({
      severity: SERVERIFY_ALERT.ERROR,
      message: err instanceof Error ? err.message : 'An unknown error occurred',
    });
    throw err;
  }
}

export async function end(sessionId: string) {
  const { addAlert } = userAlertStore.getState();
  const { setSession } = useSessionStore.getState();

  try {
    const endedSession: Session = await sessionApi.endSession(sessionId);
    setSession(endedSession);

  } catch (err) {
    addAlert({
      severity: SERVERIFY_ALERT.ERROR,
      message: err instanceof Error ? err.message : 'An unknown error occurred',
    });
    throw err;
  }
}

export async function checkout(sessionId: string) {
  const { addAlert } = userAlertStore.getState();
  const { clearSession } = useSessionStore.getState();
  try {
    await sessionApi.endSession(sessionId);
    clearSession();

  } catch (err) {
    addAlert({
      severity: SERVERIFY_ALERT.ERROR,
      message: err instanceof Error ? err.message : 'An unknown error occurred',
    });
    throw err;
  }
}
