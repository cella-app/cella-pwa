// MapContent.tsx - Fixed version
"use client";

import { useEffect, useState, useRef, memo, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Skeleton,
} from "@mui/material";
import { MapContainer, useMapEvents } from "react-leaflet";
import L, { Map as LeafletMapType, LatLng } from "leaflet";
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
import { useRadiusStore } from "../map/stores/radius.store";
import { LocationData } from "@/shared/data/models/Location";
import { calculateDistanceNew, getAllowedCenterThreshold } from "@/shared/utils/location";
import { useEventStore } from '@/features/map/stores/event.store';
import { useLoadingStore } from '@/features/map/stores/loading.store';

const LOCATION_PERMISSION_KEY = "locationPermissionAsked";

// Helper function to get consistent latitude/longitude from different types
function getCoords(location: { latitude: number; longitude: number } | LatLng) {
  if ("lat" in location && "lng" in location) {
    return { latitude: location.lat, longitude: location.lng };
  }
  return location;
}

function MapInitializer({ mapRef }: { mapRef: React.MutableRefObject<LeafletMapType | null> }) {
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

  const { changeState } = useEventStore()
  const { setLoading } = useLoadingStore()

  const isUserCenterInValidRange = useCallback(
    (userLocation: LocationData, centerLocation: LocationData, radius: number): boolean => {
      const threshold = getAllowedCenterThreshold(radius);
      const distance = calculateDistanceNew(userLocation, centerLocation);
      return distance <= threshold;
    },
    [],
  );

  const map = useMapEvents({
    movestart: () => {
      isMovingRef.current = true;
      // Do NOT clear pods here; let MapLayersAndControls handle pod transitions
    },

    zoomstart: () => {
      isMovingRef.current = true;
      // Do NOT clear pods here; let MapLayersAndControls handle pod transitions
    },

    zoomend: () => {
      isMovingRef.current = false;
      const zoom = map.getZoom();
      const center = map.getCenter();
      const coords = { latitude: center.lat, longitude: center.lng };

      // Update radius theo zoom
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
      setLoading(false)
      changeState(true);
    },

    moveend: () => {
      isMovingRef.current = false;
      const center = map.getCenter();
      const coords = { latitude: center.lat, longitude: center.lng };
      setCurrentMapCenter(coords);
      setLoading(false)
      if (currentLocation && !isUserCenterInValidRange(currentLocation, coords, radius)) {
        changeState(true);
      } else {
        changeState(false);
      }

      console.log("coords", coords);
    },
  });

  // Initial fetch when map is ready - only runs once
  useEffect(() => {
    console.log("[useEffect] Initial fetch triggered");
    const zoom = map.getZoom();
    const locationToUse = currentLocation || map.getCenter();
    const coords = getCoords(locationToUse);

    console.log("[useEffect] Using location:", coords);
    console.log("[useEffect] Using zoom:", zoom);
  }, [currentLocation, map])

  return null;
}

export default memo(function MapContent() {
  const { current: currentReservation } = useReservationStore();
  const [selectedPod, setSelectedPod] = useState<PodList | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null); // Use correct User type if available
  const [loadingUser, setLoadingUser] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);

  const mapRef = useRef<LeafletMapType | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const { currentLocation, setStartTracking } = useLocationTrackingContext();
  const router = useRouter();
  const isUserTriggeredFlyToRef = useRef(false);

  // Fixed: Initialize as false, only show when needed
  const [openLocationDialog, setOpenLocationDialog] = useState(false);

  const handleAllowLocation = () => {
    setStartTracking(true);
    localStorage.setItem(LOCATION_PERMISSION_KEY, "true");
    setOpenLocationDialog(false);
    console.log("✅ Location permission: ALLOWED");
  };

  const handleDenyLocation = () => {
    localStorage.setItem(LOCATION_PERMISSION_KEY, "true");
    setOpenLocationDialog(false);
    console.log("❌ Location permission: DENIED");
  };

  // Fixed: Better permission logic
  useEffect(() => {
    console.log("🔍 MapContent - Checking location permission...");

    const alreadyAsked = localStorage.getItem(LOCATION_PERMISSION_KEY);
    console.log("🔍 Already asked:", alreadyAsked);

    if (alreadyAsked === "true") {
      console.log("✅ Permission already handled, skipping dialog");
      setOpenLocationDialog(false);
      return;
    }

    // Only check permissions API if not already asked
    if (navigator.permissions) {
      navigator.permissions.query({ name: "geolocation" }).then((result) => {
        console.log("🔍 Permission state:", result.state);

        if (result.state === "granted") {
          console.log("✅ Permission already granted, auto-allowing");
          setStartTracking(true);
          localStorage.setItem(LOCATION_PERMISSION_KEY, "true");
          setOpenLocationDialog(false);
        } else if (result.state === "denied") {
          console.log("❌ Permission already denied, skipping dialog");
          localStorage.setItem(LOCATION_PERMISSION_KEY, "true");
          setOpenLocationDialog(false);
        } else if (result.state === "prompt") {
          console.log("❓ Permission prompt needed, showing dialog");
          setOpenLocationDialog(true);
        }

        result.onchange = () => {
          console.log("🔄 Permission changed to", result.state);
        };
      }).catch((error) => {
        console.warn("⚠️ Permissions API failed:", error);
        // Fallback: show dialog if permissions API fails
        setOpenLocationDialog(true);
      });
    } else {
      console.warn("⚠️ Permissions API not supported");
      // Fallback: show dialog if permissions API not supported
      setOpenLocationDialog(true);
    }
  }, [setStartTracking]);

  const { setCurrentMapCenter } = useMapStore();
  const { radius, setRadius } = useRadiusStore();

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
      iconRetinaUrl: "/point.png",
      iconUrl: "/point.png",
      shadowUrl:
        "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });
    setMapLoaded(true);
  }, []);

  if (!mapLoaded || loadingUser) {
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
        style={{ height: "100vh", width: "100%" }}
        ref={mapRef}
        attributionControl={false}
        worldCopyJump={false}
        maxBounds={[
          [-85, -180],
          [85, 180],
        ]}
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
            <Skeleton
              variant="circular"
              width={40}
              height={40}
            />
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
            bottom: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1002,
            display: "flex",
            justifyContent: "center",
            maxWidth: "400px",
            ...(window.innerWidth <= 330
              ? {
                bottom: "10px",
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

      <Dialog
        open={openLocationDialog}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 3,
              p: { xs: 1, sm: 2 },
              "@media (max-width:330px)": {
                width: "calc(100% - 10pt)",
                margin: "10pt",
              },
              "@media (max-width:300px)": {
                width: "calc(100% - 5pt)",
                margin: "5pt",
              },
              "@media (max-width:280px)": {
                width: "100%",
                margin: "2pt",
              },
              "@media (max-height:500px)": {
                height: "calc(100% + 10 pt)",
                margin: "-2pt",
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
            alignItems: "center",
            margin: 0,
            "@media (max-width:330px)": {
              "& .MuiButton-root": {
                padding: "6px 12px",
              },
            },
          }}
          disableSpacing={true}
        >
          <Button
            onClick={handleAllowLocation}
            variant="contained"
            color="primary"
            size="small"
            sx={{
              py: { xs: 1, sm: 0.5 },
              textTransform: 'none',
              margin: 0,
            }}
          >
            Allow
          </Button>
          <Button
            onClick={handleDenyLocation}
            variant="outlined"
            color="inherit"
            size="small"
            sx={{
              py: { xs: 1, sm: 0.5 },
              textTransform: 'none',
              margin: 0,
            }}
          >
            No
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
});