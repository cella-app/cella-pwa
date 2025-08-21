'use client';

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import L, { Map as LeafletMapType, DivIcon, Icon } from 'leaflet';
import { useLocationTrackingContext } from '@/hooks/LocationTrackingContext';
import UserLocalPointIcon from '@/components/icons/UserLocalPointIcon';
import { renderToString } from 'react-dom/server';
import { PodList } from '@/shared/data/models/Pod';

// Dynamically import Leaflet components with no SSR
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);

interface MapLayersAndControlsProps {
  map: LeafletMapType | null;
  onMapLoad?: () => void;
  onPodSelect?: (pod: PodList) => void;
}

interface PodWithVisibility extends PodList {
  isFading?: boolean;
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
  const [fadingPodIcon, setFadingPodIcon] = useState<Icon | null>(null);
  const { currentLocation, pods } = useLocationTrackingContext();
  const clickLock = useRef(false);
  const [displayedPods, setDisplayedPods] = useState<PodWithVisibility[]>([]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
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
          className: 'pod-marker',
        })
      );

      setFadingPodIcon(
        L.icon({
          iconUrl: '/point.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          className: 'pod-marker fading',
        })
      );
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

  useEffect(() => {
    if (!pods || !isClient) return;

    // Compare new pods with displayed pods
    const newPodIds = new Set(pods.map((pod) => pod.id));
    const currentPodIds = new Set(displayedPods.map((pod) => pod.id));

    // Identify pods to keep, add, or remove
    const podsToKeep = displayedPods.filter(
      (pod) => newPodIds.has(pod.id) && !pod.isFading
    );
    const podsToAdd = pods.filter((pod) => !currentPodIds.has(pod.id));
    const podsToRemove = displayedPods
      .filter((pod) => !newPodIds.has(pod.id) && !pod.isFading)
      .map((pod) => ({ ...pod, isFading: true }));

    // Update state with new pods and fading pods
    setDisplayedPods([...podsToKeep, ...podsToAdd, ...podsToRemove]);

    // Set timeout to remove fading pods after 1 second
    const fadingPods = podsToRemove.map((pod) => pod.id);
    if (fadingPods.length > 0) {
      const timeout = setTimeout(() => {
        setDisplayedPods((prev) =>
          prev.filter((pod) => !fadingPods.includes(pod.id))
        );
      }, 1000);

      return () => clearTimeout(timeout);
    }
  }, [pods, isClient]);

  const handleMarkerClick = (pod: PodWithVisibility) => {
    if (clickLock.current || pod.isFading) return;
    clickLock.current = true;
    onPodSelect?.(pod);
    setTimeout(() => {
      clickLock.current = false;
    }, 300);
  };

  if (!isClient) {
    return null;
  }

  return (
    <>
      <style>
        {`
          .pod-marker {
            transition: opacity 1s ease-out;
          }
          .pod-marker.fading {
            opacity: 0;
          }
        `}
      </style>
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        noWrap={true}
        bounds={[[-90, -180], [90, 180]]}
      />

      {currentLocation && myLocationIcon && (
        <Marker
          position={[currentLocation.latitude, currentLocation.longitude]}
          icon={myLocationIcon}
        />
      )}

      {displayedPods.length > 0 && podIcon && fadingPodIcon && displayedPods.map((pod) => {
        const position = [pod.location[1], pod.location[0]] as [number, number];
        return (
          <Marker
            key={pod.id}
            position={position}
            icon={pod.isFading ? fadingPodIcon : podIcon}
            eventHandlers={{
              click: () => handleMarkerClick(pod),
            }}
          />
        );
      })}
    </>
  );
};