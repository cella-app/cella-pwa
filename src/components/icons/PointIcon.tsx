'use client';

import L from 'leaflet';
import { Pod } from '@/shared/data/models/Pod';

export const createPointIcon = (pod: Pod) => {
	let iconClass = 'pod-marker-icon';

	switch (pod.status) {
		case 'available':
			iconClass += ' available';
			break;
		case 'unavailable':
			iconClass += ' unavailable';
			break;
		case 'close':
			iconClass += ' close';
			break;
		default:
			iconClass += ' default';
	}

	return L.divIcon({
		className: iconClass,
		html: '<div class="pod-marker-content"></div>',
		iconSize: [40, 40],
		iconAnchor: [20, 20]
	});
};
