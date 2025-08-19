// src/components/MapLoadingIndicator.tsx
'use client';

import { useLocationTrackingContext } from '@/hooks/LocationTrackingContext';
import { Loader2 } from 'lucide-react';

const MapLoadingIndicator = () => {
	const { loading, pods } = useLocationTrackingContext();

	// Hiển thị loading khi đang fetch hoặc khi pods bị clear (length = 0 và đang loading)
	const showLoading = loading || (pods.length === 0 && loading);
	const showNoPods = !loading && pods.length === 0;

	if (showLoading) {
		return (
			<div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur-sm rounded-lg shadow-lg px-4 py-2 flex items-center gap-2">
				<Loader2 className="w-4 h-4 animate-spin text-blue-600" />
				<span className="text-sm font-medium text-gray-700">
					Đang tìm kiếm pods...
				</span>
			</div>
		);
	}

	if (showNoPods) {
		return (
			<div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur-sm rounded-lg shadow-lg px-4 py-2">
				<span className="text-sm font-medium text-gray-500">
					Không có pods trong khu vực này
				</span>
			</div>
		);
	}

	return null;
};

export default MapLoadingIndicator;