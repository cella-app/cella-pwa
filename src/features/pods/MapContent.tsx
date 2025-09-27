// MapContent.tsx - Simplified version
"use client";

import { useEffect, useState, useRef, memo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Skeleton,
} from "@mui/material";
import { MapContainer, useMapEvents } from "react-leaflet";
import L, { Map as LeafletMapType } from "leaflet";
import { MapLayersAndControls } from "@/features/pods/MapLayersAndControls";
import WorkspacePopup from "@/features/pods/WorkspacePopup";
import { PodList } from "@/shared/data/models/Pod";
import { useLocationTrackingContext } from "@/hooks/LocationTrackingContext";
import { useOutsideClick } from "@/hooks/useOutsideClick";
import "leaflet/dist/leaflet.css";
import "@/styles/map.css";
import LocateControl from "./LocateControl";
import { useRouter } from "next/navigation";
import { useReservationStore } from "@/features/reservation/stores/reservation.store";
import { useMapStore } from "@/features/map/stores/map.store";
import { getMe } from "@/features/me/me.action";
import { ZOOM_RADIUS_CONFIG } from "@/shared/config/mapConfig";
import { Avatar } from "@mui/material";
import { DEFAULT_CENTER } from "@/shared/config/env";
import CenterMapControl from "@/components/CenterMapControl";
import MapLoader from "@/components/MapLoader";
import { useRadiusStore } from "../map/stores/radius.store";
import { LocationData } from "@/shared/data/models/Location";
import { calculateDistanceNew, getAllowedCenterThreshold } from "@/shared/utils/location";
import { useEventStore } from '@/features/map/stores/event.store';
import { useLoadingStore } from '@/features/map/stores/loading.store';
import { useWorkspacePopup } from '@/hooks/WorkspacePopupContext';
import { getEnvironmentInfo, getLocateButtonBottomOffset } from '@/shared/utils/positioning';
// import MobileDebugger from "@/components/LocationDebugger";

function MapInitializer({ mapRef }: { mapRef: React.RefObject<LeafletMapType | null> }) {
  const { setMap } = useMapStore();

  useEffect(() => {
    if (mapRef.current) {
      setMap(mapRef.current);
    }
  }, [mapRef, setMap]);

  return null;
}

function MapEventHandlers({
  currentLocation,
  setRadius,
  radius,
}: {
  currentLocation: { latitude: number; longitude: number } | null;
  setRadius: (radius: number) => void;
  radius: number;
}) {
  const isMovingRef = useRef(false);

  const {
    lastMapCenter,
    currentMapCenter,
    setLastMapCenter,
    setCurrentMapCenter,
  } = useMapStore();

  const { changeState, changeStateShowLoader } = useEventStore()
  const { setLoading } = useLoadingStore()

  const isUserCenterInValidRange = (
    userLocation: LocationData,
    centerLocation: LocationData,
    radius: number
  ): boolean => {
    const threshold = getAllowedCenterThreshold(radius);
    const distance = calculateDistanceNew(userLocation, centerLocation);
    return distance <= threshold;
  };

  const map = useMapEvents({
    movestart: () => {
      isMovingRef.current = true;
    },

    zoomstart: () => {
      isMovingRef.current = true;
    },

    zoomend: () => {
      isMovingRef.current = false;
      const zoom = map.getZoom();
      const center = map.getCenter();
      const coords = { latitude: center.lat, longitude: center.lng };

      const closestConfig = ZOOM_RADIUS_CONFIG.reduce((prev, curr) =>
        Math.abs(curr.zoom - zoom) < Math.abs(prev.zoom - zoom) ? curr : prev
      );
      setRadius(closestConfig.radius);

      if (!lastMapCenter) {
        setLastMapCenter(coords);
      } else if (currentMapCenter) {
        setLastMapCenter(currentMapCenter);
      }

      setCurrentMapCenter(coords);
      setLoading(false);
      changeState(true);
      changeStateShowLoader(true);
    },

    moveend: () => {
      isMovingRef.current = false;
      const center = map.getCenter();
      const coords = { latitude: center.lat, longitude: center.lng };
      setCurrentMapCenter(coords);
      setLoading(false);

      if (currentLocation && !isUserCenterInValidRange(currentLocation, coords, radius)) {
        changeState(true);
        changeStateShowLoader(true);
      } else {
        changeState(false);
        changeStateShowLoader(false);
      }

      console.log("coords", coords);
    },
  });

  return null;
}

export default memo(function MapContent() {
  const { current: currentReservation } = useReservationStore();
  const [selectedPod, setSelectedPod] = useState<PodList | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);
  const { setPopupOpen } = useWorkspacePopup();
  const [loadingUser, setLoadingUser] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [popupBottomOffset, setPopupBottomOffset] = useState("20px");

  const mapRef = useRef<LeafletMapType | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const isUserTriggeredFlyToRef = useRef(false);

  // Use the centralized location permission system
  const {
    currentLocation,
    needsUserDecision,
    isPermissionLoading,
    allowLocation,
    denyLocation
  } = useLocationTrackingContext();

  const { setCurrentMapCenter } = useMapStore();
  const { radius, setRadius } = useRadiusStore();

  useOutsideClick(popupRef, () => {
    if (selectedPod) {
      setSelectedPod(null);
    }
  });

  // Track popup state for AddToHome button positioning
  useEffect(() => {
    setPopupOpen(!!selectedPod);
  }, [selectedPod, setPopupOpen]);

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

  useEffect(() => {
    const updatePopupPosition = () => {
      const env = getEnvironmentInfo();
      const bottomOffset = getLocateButtonBottomOffset(env.isSafari, env.isIOS, env.isStandalone);
      setPopupBottomOffset(bottomOffset);
    };

    updatePopupPosition();

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = () => {
      setTimeout(updatePopupPosition, 100);
    };
    mediaQuery.addEventListener('change', handleDisplayModeChange);

    const handleResize = () => {
      setTimeout(updatePopupPosition, 100);
    };
    window.addEventListener('resize', handleResize);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const visualViewport = (window as any).visualViewport;
    if (visualViewport) {
      visualViewport.addEventListener('resize', handleResize);
    }

    return () => {
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
      window.removeEventListener('resize', handleResize);
      if (visualViewport) {
        visualViewport.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  useEffect(() => {
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "/point.png",
      iconUrl: "/point.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });
    setMapLoaded(true);
  }, []);

  if (!mapLoaded || loadingUser || isPermissionLoading) {
    return (
      <div
        style={{
          height: "100vh",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5f5f5",
        }}
      >
        <div>Loading...</div>
      </div>
    );
  }

  const handlePodSelect = (pod: PodList) => {
    if (!selectedPod || selectedPod.id !== pod.id) {
      setSelectedPod(pod);
    }
  };

  return (
    <>
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={15}
        minZoom={4}
        maxZoom={25}
        scrollWheelZoom={true}
        zoomControl={false}
        style={{ height: "100vh", width: "100%" }}
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
        <MapInitializer mapRef={mapRef} />
        <CenterMapControl />
        <MapLoader />
        <MapEventHandlers
          currentLocation={currentLocation}
          setRadius={setRadius}
          radius={radius}
        />
        <LocateControl
          onLocate={(latlng) => {
            console.log("[LocateControl] User located at:", latlng);
            isUserTriggeredFlyToRef.current = true;
            setCurrentMapCenter(latlng);
          }}
        />
        {mapRef.current && (
          <MapLayersAndControls
            map={mapRef.current}
            onMapLoad={() => console.log("Map loaded")}
            onPodSelect={handlePodSelect}
          />
        )}
      </MapContainer>

      {user && (
        <div
          style={{
            position: "absolute",
            top: 24,
            right: 24,
            zIndex: 1001,
            cursor: "pointer",
            background: "white",
            borderRadius: "50%",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            padding: 2,
            width: 48,
            height: 48,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => router.push("/profile")}
        >
          {!imageLoaded && (
            <Skeleton variant="circular" width={40} height={40} />
          )}
          <Avatar
            alt="User Avatar"
            onLoad={() => setImageLoaded(true)}
            src={user?.avatar_url}
            sx={{
              width: 44,
              height: 44,
              mx: "auto",
              fontSize: 36,
              borderRadius: "50%",
              objectFit: "cover",
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
            position: "absolute",
            bottom: popupBottomOffset,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1002,
            display: "flex",
            justifyContent: "center",
            maxWidth: "400px",
            ...(window.innerWidth <= 330
              ? {
                bottom: popupBottomOffset,
                maxWidth: "calc(100% - 15pt)",
                padding: "0 15pt",
              }
              : {}),
          }}
        >
          <WorkspacePopup
            id={selectedPod.id}
            name={selectedPod.name || "Unnamed Pod"}
            status={selectedPod.status}
            accompanying_services={selectedPod.accompanying_services}
            currentReservation={currentReservation}
          />
        </div>
      )}

      {/* Simplified permission dialog - only shows when actually needed */}
      <Dialog
        open={needsUserDecision}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 3,
              p: { xs: 1, sm: 2 },
              "@media (max-width:330px)": {
                width: "calc(100% - 10pt)",
                margin: "10pt",
              },
            },
          },
        }}
      >
        <DialogTitle>Allow Location Access</DialogTitle>
        <DialogContent>
          <p>
            To show workplaces near you, the app needs access to your current
            location. Would you like to enable location services?
          </p>
        </DialogContent>
        <DialogActions
          sx={{
            justifyContent: "center",
            gap: 2,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
          }}
        >
          <Button
            onClick={allowLocation}
            variant="contained"
            color="primary"
            size="small"
            sx={{ textTransform: 'none' }}
          >
            Allow
          </Button>
          <Button
            onClick={denyLocation}
            variant="outlined"
            color="inherit"
            size="small"
            sx={{ textTransform: 'none' }}
          >
            No
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Loading indicator for pin fetching */}
      
      {/* Mobile Debug Overlay - only in development */}
      {/* <MobileDebugger /> */}
    </>
  );
});