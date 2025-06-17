'use client';

import { useEffect, useState } from 'react';
import { TileLayer, Marker, Circle } from 'react-leaflet';
import L, { Map as LeafletMapType } from 'leaflet';
import { useLocationTracking } from '@/hooks/useLocationTracking';
import { PodList } from '@/shared/data/models/Pod';


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
  const { currentLocation, pods, error } = useLocationTracking(1000);

  useEffect(() => {
    if (map && currentLocation && !mapLoaded) {
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
  }, [map, currentLocation, mapLoaded, onMapLoad]);

  if (error) {
    console.error('Location error:', error);
  }

  const myLocationIcon = L.divIcon({
    className: 'user-location-marker',
    iconSize: [50, 50], 
    iconAnchor: [25, 25],
  });

  return (
    <>
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />

      {currentLocation && (
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

      {pods && pods.length > 0 && pods.map((pod: PodList) => {
        const position = [pod.location[1], pod.location[0]] as [number, number];
        const podIcon = L.icon({
          iconUrl: '/point.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        });
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