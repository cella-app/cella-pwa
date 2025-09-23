'use client';

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import L, { Map as LeafletMapType, DivIcon, Icon } from 'leaflet';
import { useLocationTrackingContext } from '@/hooks/LocationTrackingContext';
import UserLocalPointIcon from '@/components/icons/UserLocalPointIcon';
import { renderToString } from 'react-dom/server';
import { PodList } from '@/shared/data/models/Pod';
import { useEventStore } from '../map/stores/event.store';
import { useMapStore } from '@/features/map/stores/map.store';
import { useRadiusStore } from '@/features/map/stores/radius.store';
import { getPodsNearMe } from '@/features/pods/pods.action';
import {
  Button,
} from "@mui/material";
import { useLoadingStore } from '@/features/map/stores/loading.store';

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
  const { currentLocation, pods, setPods } = useLocationTrackingContext();
  const { currentMapCenter } = useMapStore();
  const { radius } = useRadiusStore();
  const clickLock = useRef(false);
  const [displayedPods, setDisplayedPods] = useState<PodWithVisibility[]>([]);
  const { showButtonSearch, changeState } = useEventStore()
  const { setLoading } = useLoadingStore();

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
              ${renderToString(<UserLocalPointIcon width="44" height="44" fill="#007BFF" />)}
            </div>
          `,
          iconSize: [44, 44],
          iconAnchor: [22, 22],
        })
      );

      setPodIcon(
        L.icon({
          iconUrl: '/point.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
          iconSize: [44, 44],
          iconAnchor: [22, 44],
          className: 'pod-marker',
        })
      );

      setFadingPodIcon(
        L.icon({
          iconUrl: '/point.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
          iconSize: [44, 44],
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
    console.warn("showButtonSearch", showButtonSearch)
  }, [showButtonSearch]);

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

    // Progressive loading: Add new pods in batches for better UX
    if (podsToAdd.length > 10) {
      // For large datasets, add pods progressively
      const batchSize = 5;
      let batchIndex = 0;
      
      // Start with first batch
      setDisplayedPods([...podsToKeep, ...podsToAdd.slice(0, batchSize), ...podsToRemove]);
      
      // Add remaining pods in batches with small delays
      const addNextBatch = () => {
        batchIndex += batchSize;
        if (batchIndex < podsToAdd.length) {
          setDisplayedPods(prev => [
            ...prev.filter(p => !p.isFading), 
            ...podsToAdd.slice(0, batchIndex + batchSize)
          ]);
          setTimeout(addNextBatch, 50); // 50ms delay between batches
        }
      };
      
      setTimeout(addNextBatch, 100); // Start after 100ms
    } else {
      // For small datasets, add all at once
      setDisplayedPods([...podsToKeep, ...podsToAdd, ...podsToRemove]);
    }

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

  const handleSearchButtonClick = async () => {
    changeState(false);
    setLoading(true);
    if (!currentMapCenter || !radius) return;

    try {
      const response = await getPodsNearMe({
        latitude: currentMapCenter.latitude,
        longitude: currentMapCenter.longitude,
        radius: radius,
      });
      if (response?.data?.pods) {
        setPods(response.data.pods);
      } else {
        console.error('Invalid response format from server during search');
      }
    } catch (err) {
      console.error('Error fetching pods on search button click:', err);
    }

    setLoading(false);
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
          .search-button-container {
            position: absolute;
            top: 10%;
            left: 50%;
            transform: translateX(-50%);
            z-index: 1000;
          }
          .search-button {
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 12px;
            min-width: auto;
            min-height: 2.75rem; /* Adjusted height */
            height: auto;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
          }
        `}
      </style>
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        noWrap={true}
        bounds={[[-90, -180], [90, 180]]}
      />

      {showButtonSearch && (
        <div className="search-button-container">
          <Button
            onClick={handleSearchButtonClick}
            variant="contained"
            color="primary"
            className='search-button'
            sx={{
              boxShadow: 'none',
              maxWidth: "200px",
              color: 'white',
              py: 1.5,
              fontWeight: 600,
              '&:hover': { boxShadow: 'none' },
            }}
          >
            Search this area
          </Button>
        </div>
      )}

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
