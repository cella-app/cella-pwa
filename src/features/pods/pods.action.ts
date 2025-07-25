"use client";

import { podApi, PodNearMeRequest, PodNearMeResponse } from '../../shared/api/pod.api';
import { userAlertStore, SERVERIFY_ALERT } from '../alert/stores/alert.store';

export async function getPodsNearMe(request: PodNearMeRequest = {
	longitude: 0,
	latitude: 0,
	radius: 600
}): Promise<PodNearMeResponse> {
	const { addAlert } = userAlertStore.getState();

	try {
		const data = await podApi.getPodsNearMe(request);

		if (!data) {
			throw new Error('No pods found');
		}

		return data;

	} catch (err) {
		addAlert({
			severity: SERVERIFY_ALERT.ERROR,
			message: (err instanceof Error ? err.message : 'An unknown error occurred')
		})
		throw err;
	}
}

export async function getPods() {
	const { addAlert } = userAlertStore.getState();

	try {
		const data = await podApi.getPodsNearMe({
			longitude: 0,
			latitude: 0,
			radius: 2000
		});

		if (!data) {
			throw new Error('No pods found');
		}

		return data;

	} catch (err) {
		addAlert({
			severity: SERVERIFY_ALERT.ERROR,
			message: (err instanceof Error ? err.message : 'An unknown error occurred')
		})
		throw err;
	}
}
export async function getPodDetail(id: string) {
	const { addAlert } = userAlertStore.getState();

	try {
		const data = await podApi.getPod(id);

		if (!data) {
			throw new Error('No pods found');
		}

		return data;

	} catch (err) {
		addAlert({
			severity: SERVERIFY_ALERT.ERROR,
			message: (err instanceof Error ? err.message : 'An unknown error occurred')
		})
		throw err;
	}
}
