export const ZOOM_RADIUS_CONFIG = [
  { zoom: 11, radius: 20000 },  // 20km (doubled from 10km)
  { zoom: 12, radius: 10000 },  // 10km (doubled from 5km)
  { zoom: 13, radius: 5000 },   // 5km (doubled from 2.5km)
  { zoom: 14, radius: 2000 },   // 2km (doubled from 1km)
  { zoom: 15, radius: 1200 },   // 1.2km (doubled from 600m)
];

export const DEBOUNCE_TIME = 150; // Increased slightly to reduce API calls with caching
export const CACHE_INVALIDATION_DISTANCE = 100; // meters - invalidate cache if user moves this far
export const PREFETCH_RADIUS_MULTIPLIER = 1.5; // Prefetch 1.5x radius for smooth panning
