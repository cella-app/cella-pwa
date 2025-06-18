'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { Map as LeafletMapType, DivIcon, Icon } from 'leaflet';
import { useLocationTracking } from '@/hooks/useLocationTracking';
import { PodList } from '@/shared/data/models/Pod';
import UserLocalPointIcon from '@/components/icons/UserLocalPointIcon';
import { renderToString } from 'react-dom/server';

// Dynamically import Leaflet components with no SSR
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Circle = dynamic(
  () => import('react-leaflet').then((mod) => mod.Circle),
  { ssr: false }
);

interface MapLayersAndControlsProps {
  map: LeafletMapType | null;
  onMapLoad?: () => void;
  onPodSelect?: (pod: PodList) => void;
}

export const MapLayersAndControls = ({
  map,
  onMapLoad,
  onPodSelect,
}: MapLayersAndControlsProps) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [myLocationIcon, setMyLocationIcon] = useState<DivIcon | null>(null);
  const [podIcon, setPodIcon] = useState<Icon | null>(null);
  const { currentLocation, pods, error } = useLocationTracking(1000);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      import('leaflet').then((L) => {
        setMyLocationIcon(
          L.divIcon({
            className: 'user-location-marker',
            html: `
              <div class="user-location-icon">
                ${renderToString(<UserLocalPointIcon width="32" height="32" fill="#007BFF" />)}
              </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          })
        );

        setPodIcon(
          L.icon({
            iconUrl: '/point.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
            iconSize: [32, 32],
            iconAnchor: [16, 32],
          })
        );
      });
    }
  }, [isClient]);

  useEffect(() => {
    if (isClient && map && currentLocation && !mapLoaded) {
      map.flyTo(
        [currentLocation.latitude, currentLocation.longitude],
        15,
        {
          duration: 2
        }
      );
      setMapLoaded(true);
      onMapLoad?.();
    }
  }, [map, currentLocation, mapLoaded, onMapLoad, isClient]);

  if (!isClient) {
    return null;
  }

  if (error) {
    console.error('Location error:', error);
  }

  return (
    <>
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />

      {currentLocation && myLocationIcon && (
        <>
          <Marker
            position={[currentLocation.latitude, currentLocation.longitude]}
            icon={myLocationIcon}
          />

          <Circle
            center={[currentLocation.latitude, currentLocation.longitude]}
            radius={200}
            pathOptions={{
              color: 'transparent',
              fillColor: '#007BFF',
              fillOpacity: 0.2,
            }}
          />
        </>
      )}

      {pods && pods.length > 0 && podIcon && pods.map((pod: PodList) => {
        const position = [pod.location[1], pod.location[0]] as [number, number];
        return (
          <Marker
            key={pod.id}
            position={position}
            icon={podIcon}
            eventHandlers={{
              click: () => {
                console.log('Pod clicked, calling onPodSelect with:', pod);
                onPodSelect?.(pod);
              }
            }}
          />
        );
      })}
    </>
  );
}; 