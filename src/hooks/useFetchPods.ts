import { useCallback } from "react";
import { getPodsNearMe } from "@/features/pods/pods.action";
import { PodList } from "@/shared/data/models/Pod";

export const useFetchPods = (
	radius: number,
	setPods: (pods: PodList[]) => void,
	setLastLocation: (loc: { latitude: number; longitude: number }) => void,
	setCentroid: (centroid: [number, number] | null) => void,
	setError: (err: string | null) => void,
	setLoading: (loading: boolean) => void
) => {
	return useCallback(async (lat: number, lng: number) => {
		try {
			setLoading(true);
			setError(null);

			const response = await getPodsNearMe({ latitude: lat, longitude: lng, radius });
			if (response?.data?.pods) {
				setPods(response.data.pods);
				setLastLocation({ latitude: lat, longitude: lng });

				if (response.meta?.centroid && Array.isArray(response.meta.centroid)) {
					setCentroid([response.meta.centroid[0], response.meta.centroid[1]]);
				}
			} else {
				setError("Invalid response from server");
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to fetch pods");
		} finally {
			setLoading(false);
		}
	}, [radius]);
};
