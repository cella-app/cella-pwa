'use client';

import { useServerInsertedHTML } from 'next/navigation';
import React, { useState } from 'react';
import { CacheProvider } from '@emotion/react';
import createEmotionCache from '@/createEmotionCache';
import createEmotionServer from '@emotion/server/create-instance';

export default function EmotionRegistry({ children }: { children: React.ReactNode }) {
	const [cache] = useState(() => createEmotionCache());
	const server = createEmotionServer(cache);

	useServerInsertedHTML(() => {
		const styles = server.extractCriticalToChunks(cache.sheet.tags.map((tag) => tag.textContent).join(''));
		return (
			<>
				{styles.styles.map((style) => (
					<style
						key={style.key}
						data-emotion={`${style.key} ${style.ids.join(' ')}`}
						dangerouslySetInnerHTML={{ __html: style.css }}
					/>
				))}
			</>
		);
	});

	return <CacheProvider value={cache}>{children}</CacheProvider>;
}
