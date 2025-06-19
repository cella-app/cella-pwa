'use client';

import { useEffect, useState, useRef, memo } from 'react';
import { MapContainer } from 'react-leaflet';
import L, { Map as LeafletMapType } from 'leaflet';

import { MapLayersAndControls } from '@/components/MapLayersAndControls';
import WorkspacePopup from '@/components/WorkspacePopup';
import { PodList } from '@/shared/data/models/Pod';
import { useLocationTracking } from '@/hooks/useLocationTracking';
import { useOutsideClick } from '@/hooks/useOutsideClick'
import 'leaflet/dist/leaflet.css';
import '@/styles/map.css';
import LocateControl from './LocateControl';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/stores/auth.store';

const DEFAULT_CENTER: [number, number] = [21.0285, 105.8542];

export default memo(function MapContent() {
  const [selectedPod, setSelectedPod] = useState<PodList | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<LeafletMapType | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const { lastSearchCenter } = useLocationTracking(5000);
  const router = useRouter();
  const user = useAuthStore(state => state.user);

  useOutsideClick(popupRef, () => {
    if (selectedPod) {
      setSelectedPod(null);
    }
  });

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

  useEffect(() => {
    if (mapRef.current && lastSearchCenter) {
      mapRef.current.flyTo([lastSearchCenter[1], lastSearchCenter[0]], 15, { duration: 2 });
    }
  }, [lastSearchCenter]);

  if (!mapLoaded) {
    return null; 
  }

  const center = lastSearchCenter 
    ? [lastSearchCenter[1], lastSearchCenter[0]] as [number, number]
    : DEFAULT_CENTER;

  return (
    <>
      <MapContainer
        center={center}
        zoom={25}
        scrollWheelZoom={true}
        style={{ height: '100vh', width: '100%' }}
        ref={mapRef}
        attributionControl={false}
      >
        <LocateControl />
        {mapRef.current && (
          <MapLayersAndControls
            map={mapRef.current}
            onMapLoad={() => console.log('Map loaded')}
            onPodSelect={setSelectedPod}
          />
        )}
      </MapContainer>

      {/* Avatar Overlay */}
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
          {user.avatar ? (
            <img
              src={user.avatar}
              alt="User Avatar"
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <span
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: '#ccc',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 22,
              }}
            >
              {user.first_name ? user.first_name[0].toUpperCase() : 'U'}
            </span>
          )}
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
        }}>
          <WorkspacePopup
            id={selectedPod.id}
            name={selectedPod.name || 'Unnamed Pod'}
            status={selectedPod.status}
            distance={`${selectedPod.distance_meters}m`}
            accompanying_services={selectedPod.accompanying_services}
          />
        </div>
      )}
    </>
  );
});
