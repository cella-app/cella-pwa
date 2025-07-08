'use client';

import { useEffect, useState, useRef, memo } from 'react';
import { MapContainer } from 'react-leaflet';
import L, { Map as LeafletMapType } from 'leaflet';

import { MapLayersAndControls } from '@/features/pods/MapLayersAndControls';
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
import {
  Avatar,
} from "@mui/material";
import { DEFAULT_CENTER } from '@/shared/config/env';

export default memo(function MapContent() {
  const { current: currentReservation } = useReservationStore();
  const [selectedPod, setSelectedPod] = useState<PodList | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null); // Use correct User type if available
  const [loadingUser, setLoadingUser] = useState(true);

  const mapRef = useRef<LeafletMapType | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const { lastSearchCenter } = useLocationTrackingContext();
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

  // Don't render until both map and user are ready
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
        minZoom={2}
        maxZoom={18}
        scrollWheelZoom={true}
        style={{ height: '100vh', width: '100%' }}
        ref={mapRef}
        attributionControl={false}
        worldCopyJump={false}
        maxBounds={[[-85, -180], [85, 180]]}
        maxBoundsViscosity={1.0}
      >
        <LocateControl />
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
});