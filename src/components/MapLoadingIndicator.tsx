// src/components/MapLoadingIndicator.tsx
'use client';

import { useLocationTrackingContext } from '@/hooks/LocationTrackingContext';
import { Loader2 } from 'lucide-react';
import { useLoadingStore } from '@/features/map/stores/loading.store';
import { useEventStore } from '@/features/map/stores/event.store';


const MapLoadingIndicator = () => {
	const { pods } = useLocationTrackingContext();
	const { loading } = useLoadingStore();
	const { showLoader } = useEventStore();

	// Show loading when fetching OR when pods are cleared but we're still loading
	// Also show loading briefly when pods array is empty (transitioning to new area)
	const showLoading = loading && showLoader;
	const showNoPods = !loading && pods.length === 0;
	
	// Enhanced loading message based on pod count
	const getLoadingMessage = () => {
		if (pods.length === 0) return 'Finding pods...';
		if (pods.length < 5) return 'Loading more pods...';
		return `Loading ${pods.length} pods...`;
	};

	console.warn("showLoading", showLoading, loading, showLoader)

	if (showLoading) {
		console.warn("showLoading OK")
		return (
			<div className="absolute top-4 right-4 z-[1000] bg-white/80 backdrop-blur-sm rounded-full shadow-md px-3 py-2 flex items-center gap-2">
				<Loader2 className="w-4 h-4 animate-spin text-green-600" />
				<span className="text-sm font-medium text-gray-600">
					{getLoadingMessage()}
				</span>
			</div>
		);
	}

	if (showNoPods) {
		return (
			<div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-white/80 backdrop-blur-sm rounded-full shadow-md px-3 py-2">
				<span className="text-sm font-medium text-gray-500">
					No pods in this area
				</span>
			</div>
		);
	}

	return null;
};

export default MapLoadingIndicator;