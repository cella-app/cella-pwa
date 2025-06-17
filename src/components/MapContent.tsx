'use client';

import { useEffect, useState, useRef, memo } from 'react';
import { MapContainer } from 'react-leaflet';
import L, { Map as LeafletMapType } from 'leaflet';
import { MapLayersAndControls } from '@/components/MapLayersAndControls';
import WorkspacePopup from '@/components/WorkspacePopup';
import { PodList } from '@/shared/data/models/Pod';
import { useLocationTracking } from '@/hooks/useLocationTracking';
import 'leaflet/dist/leaflet.css';
import '@/styles/map.css';

const DEFAULT_CENTER: [number, number] = [21.0285, 105.8542];

export default memo(function MapContent() {
  const [selectedPod, setSelectedPod] = useState<PodList | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<LeafletMapType | null>(null);
  const { lastSearchCenter } = useLocationTracking(5000);

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
        zoom={15}
        scrollWheelZoom={true}
        style={{ height: '100vh', width: '100%' }}
        ref={mapRef}
      >
        {mapRef.current && (
          <MapLayersAndControls
            map={mapRef.current}
            onMapLoad={() => console.log('Map loaded')}
            onPodSelect={setSelectedPod}
          />
        )}
      </MapContainer>

      {selectedPod && (
        <div style={{
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
          />
        </div>
      )}
    </>
  );
});
