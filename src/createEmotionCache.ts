'use client';

import createCache from '@emotion/cache';

export default function createEmotionCache(nonce?: string) {
	return createCache({
		key: 'css',
		prepend: true,
		nonce,
	});
}
