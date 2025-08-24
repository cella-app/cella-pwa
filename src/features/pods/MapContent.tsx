'use client';

import { useEffect, useState, useRef, memo } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { MapContainer, useMapEvents } from 'react-leaflet';
import L, { Map as LeafletMapType, LatLng } from 'leaflet';
import { MapLayersAndControls } from '@/features/pods/MapLayersAndControls';
import WorkspacePopup from '@/features/pods/WorkspacePopup';
import { PodList } from '@/shared/data/models/Pod';
import { useLocationTrackingContext } from '@/hooks/LocationTrackingContext';
import { useOutsideClick } from '@/hooks/useOutsideClick';
import 'leaflet/dist/leaflet.css';
import '@/styles/map.css';
import LocateControl from './LocateControl';
import { useRouter } from 'next/navigation';
import { useReservationStore } from '@/features/reservation/stores/reservation.store';
import { useMapStore } from '@/features/map/stores/map.store';
import { getMe } from '@/features/me/me.action';
import { ZOOM_RADIUS_CONFIG, DEBOUNCE_TIME } from '@/shared/config/mapConfig';
import { Avatar } from '@mui/material';
import { DEFAULT_CENTER } from '@/shared/config/env';
import CenterMapControl from '@/components/CenterMapControl';
import { useRadiusStore } from '../map/stores/radius.store';

const LOCATION_PERMISSION_KEY = 'locationPermissionAsked';


// Helper function to get consistent latitude/longitude from different types
function getCoords(location: { latitude: number; longitude: number } | LatLng) {
  if ('lat' in location && 'lng' in location) {
    return { latitude: location.lat, longitude: location.lng };
  }
  return location;
}

function MapEventHandlers({
  currentLocation,
  setRadius,
}: {
  currentLocation: { latitude: number; longitude: number } | null;
  setRadius: (radius: number) => void;
}) {
  // Refs to manage state and timeouts
  const moveDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const zoomDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const isMovingRef = useRef(false);

  const { lastMapCenter, currentMapCenter, setLastMapCenter, setCurrentMapCenter } = useMapStore();
  const map = useMapEvents({
    movestart: () => {
      console.log('[movestart] Map movement started');
      isMovingRef.current = true;
      // Do NOT clear pods here; let MapLayersAndControls handle pod transitions
    },

    zoomstart: () => {
      console.log('[zoomstart] Map zoom started');
      isMovingRef.current = true;
      // Do NOT clear pods here; let MapLayersAndControls handle pod transitions
    },

    zoomend: () => {
      if (zoomDebounceRef.current) {
        clearTimeout(zoomDebounceRef.current);
      }

      zoomDebounceRef.current = setTimeout(() => {
        isMovingRef.current = false;
        console.log('[zoomend] Event triggered');
        const zoom = map.getZoom();
        const center = map.getCenter();
        const coords = { latitude: center.lat, longitude: center.lng };
        console.log('[zoomend] Center:', coords, 'Zoom:', zoom);

        // Update radius based on zoom level
        const closestConfig = ZOOM_RADIUS_CONFIG.reduce((prev, curr) =>
          Math.abs(curr.zoom - zoom) < Math.abs(prev.zoom - zoom) ? curr : prev
        );
        setRadius(closestConfig.radius);
        if (!lastMapCenter) {
          setLastMapCenter(coords)
        } else if (currentMapCenter) {
          setLastMapCenter(currentMapCenter);
        }

        // Update map center and fetch pods
        setCurrentMapCenter(coords);
      }, DEBOUNCE_TIME);
    },

    moveend: () => {
      if (moveDebounceRef.current) {
        clearTimeout(moveDebounceRef.current);
      }

      moveDebounceRef.current = setTimeout(() => {
        isMovingRef.current = false;
        console.log('[moveend] Event triggered at:', new Date().toLocaleTimeString());

        const center = map.getCenter();
        const zoom = map.getZoom();
        const coords = { latitude: center.lat, longitude: center.lng };

        console.log('[moveend] Raw center object:', center);
        console.log('[moveend] Extracted coords:', coords);
        console.log('[moveend] Extracted zoom:', zoom);
        console.log('[moveend] Map bounds:', map.getBounds().toString());

        setCurrentMapCenter(coords);
      }, DEBOUNCE_TIME);
    },
  });

  // Initial fetch when map is ready - only runs once
  useEffect(() => {
    console.log('[useEffect] Initial fetch triggered');
    const zoom = map.getZoom();
    const locationToUse = currentLocation || map.getCenter();
    const coords = getCoords(locationToUse);

    console.log('[useEffect] Using location:', coords);
    console.log('[useEffect] Using zoom:', zoom);
  }, [map]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (moveDebounceRef.current) clearTimeout(moveDebounceRef.current);
      if (zoomDebounceRef.current) clearTimeout(zoomDebounceRef.current);
    };
  }, []);

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
  const popupRef = useRef<HTMLDivElement>(null);
  const { currentLocation, setStartTracking } = useLocationTrackingContext();
  const router = useRouter();
  const isUserTriggeredFlyToRef = useRef(false);

  const [openLocationDialog, setOpenLocationDialog] = useState(true);

  const handleAllowLocation = () => {
    setStartTracking(true);
    localStorage.setItem(LOCATION_PERMISSION_KEY, 'true');
    setOpenLocationDialog(false);
  };
  const handleDenyLocation = () => {
    localStorage.setItem(LOCATION_PERMISSION_KEY, 'true');
    setOpenLocationDialog(false);
  };

  useEffect(() => {
    const alreadyAsked = localStorage.getItem(LOCATION_PERMISSION_KEY);

    navigator.permissions.query({ name: 'geolocation' }).then((result) => {
      console.log('Permission state:', result.state);

      if (result.state === 'granted') {
        setOpenLocationDialog(false);
      } else if (result.state === 'denied') {
        setOpenLocationDialog(false);
      } else if (result.state === 'prompt' && !alreadyAsked) {
        setOpenLocationDialog(true);
      }

      result.onchange = () => {
        console.log('Permission changed to', result.state);
      };
    });
  }, []);


  const { setCurrentMapCenter } = useMapStore();
  const { setRadius } = useRadiusStore();

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

  if (!mapLoaded || loadingUser) {
    return (
      <div
        style={{
          height: '100vh',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f5f5f5',
        }}
      >
        <div>Loading...</div>
      </div>
    );
  }

  const center = DEFAULT_CENTER;

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
        minZoom={8}
        maxZoom={25}
        scrollWheelZoom={true}
        zoomControl={false}
        style={{ height: '100vh', width: '100%' }}
        ref={mapRef}
        attributionControl={false}
        worldCopyJump={false}
        maxBounds={[[-85, -180], [85, 180]]}
        maxBoundsViscosity={1.0}
        zoomAnimation={true}
        fadeAnimation={true}
        markerZoomAnimation={true}
        zoomSnap={1}
        zoomDelta={1}
        wheelPxPerZoomLevel={60}
      >
        <CenterMapControl />
        <MapEventHandlers
          currentLocation={currentLocation}
          setRadius={setRadius}
        />
        <LocateControl
          onLocate={(latlng) => {
            console.log('[LocateControl] User located at:', latlng);
            isUserTriggeredFlyToRef.current = true;
            setCurrentMapCenter(latlng);
          }}
        />
        {mapRef.current && (
          <MapLayersAndControls
            map={mapRef.current}
            onMapLoad={() => console.log('Map loaded')}
            onPodSelect={handlePodSelect}
          />
        )}
      </MapContainer>

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
              width: 44,
              height: 44,
              mx: 'auto',
              fontSize: 36,
              borderRadius: '50%',
              objectFit: 'cover',
            }}
          >
            {user?.avatar_url
              ? ''
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
            accompanying_services={selectedPod.accompanying_services}
            currentReservation={currentReservation}
          />
        </div>
      )}
      <Dialog open={openLocationDialog}>
        <DialogTitle>Allow Location Access</DialogTitle>
        <DialogContent>
          To show workplaces near you, the app needs access to your current location. Would you like to enable location services?
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDenyLocation} color="secondary">No</Button>
          <Button onClick={handleAllowLocation} variant="contained" color="primary">Allow</Button>
        </DialogActions>
      </Dialog>
    </>
  );
});