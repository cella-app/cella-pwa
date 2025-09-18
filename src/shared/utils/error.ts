'use client';

import { showHttpErrorStatus } from '@/shared/config/error';
import { userAlertStore, SERVERIFY_ALERT } from '../../features/alert/stores/alert.store';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function alertError(error: any) {
	const { addAlert } = userAlertStore.getState();
	if (showHttpErrorStatus.includes(error?.status)) {
		addAlert({
			severity: SERVERIFY_ALERT.ERROR,
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			//@ts-ignore
			message: error.message
		});
	} else {
		// addAlert({
		// 	severity: SERVERIFY_ALERT.ERROR,
		// 	message: error instanceof Error ? error.message : 'An unknown error occurred',
		// });
	}
}