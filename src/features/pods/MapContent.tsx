'use client';

import { useEffect, useState, useRef, useCallback, memo } from 'react';
import { MapContainer, useMapEvents } from 'react-leaflet';
import L, { Map as LeafletMapType, LatLng } from 'leaflet';

import { MapLayersAndControls } from '@/features/pods/MapLayersAndControls'; // Corrected import path
import WorkspacePopup from '@/features/pods/WorkspacePopup';
import { PodList } from '@/shared/data/models/Pod';
import { useLocationTrackingContext } from '@/hooks/LocationTrackingContext';
import { useOutsideClick } from '@/hooks/useOutsideClick'
import 'leaflet/dist/leaflet.css';
import '@/styles/map.css';
import LocateControl from './LocateControl';
import { useRouter } from 'next/navigation';
import { useReservationStore } from '@/features/reservation/stores/reservation.store';
import { getMe } from '@/features/me/me.action';
import { getPodsNearMe } from '@/features/pods/pods.action';
import { ZOOM_RADIUS_CONFIG, DEBOUNCE_TIME } from '@/shared/config/mapConfig';
import {
  Avatar,
} from "@mui/material";
import { DEFAULT_CENTER } from '@/shared/config/env';

// Helper function to get consistent latitude/longitude from different types
function getCoords(location: { latitude: number; longitude: number } | LatLng) {
  if ('lat' in location && 'lng' in location) {
    return { latitude: location.lat, longitude: location.lng };
  }
  return location;
}

function MapEventHandlers({ fetchPodsBasedOnMap, currentLocation }: { fetchPodsBasedOnMap: (location: { latitude: number; longitude: number }, currentZoom: number) => void, currentLocation: { latitude: number; longitude: number } | null }) {
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const map = useMapEvents({
    zoomend: () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      debounceTimeoutRef.current = setTimeout(() => {
        console.log('Debounce finished, fetching pods (from useMapEvents).');
        const zoom = map.getZoom();
        // Use currentLocation if available, otherwise fallback to map center
        const locationToUse = currentLocation || map.getCenter();
        const coords = getCoords(locationToUse);
        fetchPodsBasedOnMap(coords, zoom);
      }, DEBOUNCE_TIME);
    },
  });

  // Initial fetch when map is ready
  useEffect(() => {
    console.log('Initial fetch of pods (from useMapEvents).');
    const zoom = map.getZoom();
    // Use currentLocation if available, otherwise fallback to map center
    const locationToUse = currentLocation || map.getCenter();
    const coords = getCoords(locationToUse);
    fetchPodsBasedOnMap(coords, zoom);
  }, [fetchPodsBasedOnMap, map, currentLocation]);

  return null;
}

export default memo(function MapContent() {
  const { current: currentReservation } = useReservationStore();
  const [selectedPod, setSelectedPod] = useState<PodList | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null); // Use correct User type if available
  const [loadingUser, setLoadingUser] = useState(true);

  const mapRef = useRef<LeafletMapType | null>(null);
  const popupRef = useRef<HTMLDivElement>(null); // Corrected type
  const { lastSearchCenter, setPods, currentLocation } = useLocationTrackingContext();
  const router = useRouter();

  useOutsideClick(popupRef, () => {
    if (selectedPod) {
      setSelectedPod(null);
    }
  });

  useEffect(() => {
    async function fetchUser() {
      setLoadingUser(true);
      try {
        const me = await getMe();
        setUser(me);
      } catch {
        setUser(null);
      } finally {
        setLoadingUser(false);
      }
    }
    fetchUser();
  }, []);

  // Map initialization effect
  useEffect(() => {
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: '/point.png',
      iconUrl: '/point.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });
    setMapLoaded(true);
  }, []);

  // Map center update effect
  useEffect(() => {
    if (mapRef.current && lastSearchCenter) {
      mapRef.current.flyTo([lastSearchCenter[1], lastSearchCenter[0]], 15, { duration: 2 });
    }
  }, [lastSearchCenter]);

  const fetchPodsBasedOnMap = useCallback(async (location: { latitude: number; longitude: number }, currentZoom: number) => {
    console.log("fetchPodsBasedOnMap called with:", { location, currentZoom });

    const closestConfig = ZOOM_RADIUS_CONFIG.reduce((prev, curr) =>
      Math.abs(curr.zoom - currentZoom) < Math.abs(prev.zoom - currentZoom) ? curr : prev
    );

    try {
      const response = await getPodsNearMe({
        longitude: location.longitude,
        latitude: location.latitude,
        radius: closestConfig.radius,
      });
      setPods(response.data.pods);
      console.log("Pods fetched and set:", response.data.pods);
    } catch (error) {
      console.error("Failed to fetch pods:", error);
    }
  }, [setPods]);

  if (!mapLoaded || loadingUser) {
    return (
      <div
        style={{
          height: '100vh',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f5f5f5'
        }}
      >
        <div>Loading...</div>
      </div>
    );
  }

  const center = lastSearchCenter
    ? [lastSearchCenter[1], lastSearchCenter[0]] as [number, number]
    : DEFAULT_CENTER;

  const handlePodSelect = (pod: PodList) => {
    if (!selectedPod || selectedPod.id !== pod.id) {
      setSelectedPod(pod);
    }
  };

  return (
    <>
      <MapContainer
        center={center}
        zoom={15}
        minZoom={10}
        maxZoom={18}
        scrollWheelZoom={true}
        zoomControl={false}
        style={{ height: '100vh', width: '100%' }}
        ref={mapRef}
        attributionControl={false}
        worldCopyJump={false}
        maxBounds={[[-85, -180], [85, 180]]}
        maxBoundsViscosity={1.0}
      >
        {/* Pass currentLocation to MapEventHandlers */}
        {currentLocation && <MapEventHandlers fetchPodsBasedOnMap={fetchPodsBasedOnMap} currentLocation={currentLocation} />}
        <LocateControl fetchPodsBasedOnMap={fetchPodsBasedOnMap} />
        {mapRef.current && (
          <MapLayersAndControls
            map={mapRef.current}
            onMapLoad={() => console.log('Map loaded')}
            onPodSelect={handlePodSelect}
          />
        )}
      </MapContainer>

      {/* Avatar Overlay - Only show if user exists */}
      {user && (
        <div
          style={{
            position: 'absolute',
            top: 24,
            right: 24,
            zIndex: 2000,
            cursor: 'pointer',
            background: 'white',
            borderRadius: '50%',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            padding: 2,
            width: 48,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => router.push('/profile')}
        >
          <Avatar
            alt="User Avatar"
            src={user?.avatar_url}
            sx={{
              width: 44, height: 44, mx: "auto", fontSize: 36, borderRadius: '50%',
              objectFit: 'cover',
            }}
          >
            {user?.avatar_url
              ? ""
              : user?.first_name
                ? user.first_name[0].toUpperCase()
                : user?.email?.[0]?.toUpperCase()}
          </Avatar>
        </div>
      )}

      {selectedPod && (
        <div
          ref={popupRef}
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'center',
            width: '100%',
            maxWidth: '400px',
          }}
        >
          <WorkspacePopup
            id={selectedPod.id}
            name={selectedPod.name || 'Unnamed Pod'}
            status={selectedPod.status}
            distance={`${selectedPod.distance_meters}m`}
            accompanying_services={selectedPod.accompanying_services}
            currentReservation={currentReservation}
          />
        </div>
      )}
    </>
  );
})
