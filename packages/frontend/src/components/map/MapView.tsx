import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Map, {
  Source,
  Layer,
  Popup,
  NavigationControl,
  GeolocateControl,
} from "react-map-gl";
import type { MapRef, MapLayerMouseEvent, GeoJSONSource, ViewStateChangeEvent } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useMapClubs } from "@/hooks/useMapClubs";
import { useClubs } from "@/hooks/useClubs";
import { useSearchStore } from "@/stores/searchStore";
import type { ClubSearchResult } from "@freefitui/shared";

// Inline GeoJSON types to avoid @types/geojson dependency
interface GeoJSONPoint {
  type: "Point";
  coordinates: [number, number];
}

interface GeoJSONFeature {
  type: "Feature";
  geometry: GeoJSONPoint;
  properties: Record<string, unknown>;
}

interface GeoJSONFeatureCollection {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const ISRAEL_CENTER = {
  longitude: 34.8,
  latitude: 31.5,
  zoom: 7.5,
};

// Layer IDs
const CLUSTERS_LAYER = "clusters";
const CLUSTER_COUNT_LAYER = "cluster-count";
const UNCLUSTERED_LAYER = "unclustered-point";
const UNCLUSTERED_SELECTED_LAYER = "unclustered-point-selected";

export default function MapView() {
  const navigate = useNavigate();
  const mapRef = useRef<MapRef>(null);
  const { data } = useMapClubs();
  const { data: listData } = useClubs(); // list results for tighter fitBounds
  const selectedClubId = useSearchStore((s) => s.selectedClubId);
  const setSelectedClubId = useSearchStore((s) => s.setSelectedClubId);
  const query = useSearchStore((s) => s.query);
  const cityId = useSearchStore((s) => s.cityId);
  const categoryId = useSearchStore((s) => s.categoryId);
  const setMapBounds = useSearchStore((s) => s.setMapBounds);
  const flyToClub = useSearchStore((s) => s.flyToClub);
  const setFlyToClub = useSearchStore((s) => s.setFlyToClub);

  const [popupClub, setPopupClub] = useState<ClubSearchResult | null>(null);
  const prevFilterRef = useRef<string>("");
  const mapLoadedRef = useRef(false);

  const clubs = useMemo(() => {
    if (!data?.clubs) return [];
    return data.clubs;
  }, [data]);

  // Build GeoJSON from clubs
  const geojsonData: GeoJSONFeatureCollection = useMemo(() => {
    return {
      type: "FeatureCollection",
      features: clubs.map((club) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [club.longitude, club.latitude] as [number, number],
        },
        properties: {
          id: club.id,
          name: club.name,
          price: club.price,
          clubTypeName: club.clubTypeName || "",
          areaName: club.areaName || "",
          logoUrl: club.logoUrl || "",
          address: club.address || "",
        },
      })),
    };
  }, [clubs]);

  // Fit bounds when search results change
  // Use list results (top relevant hits) for tighter bounds when searching
  const boundsClubs = useMemo(() => {
    const hasActiveFilter = query || cityId || categoryId;
    if (hasActiveFilter && listData?.clubs?.length) {
      return listData.clubs;
    }
    return clubs;
  }, [query, cityId, categoryId, listData, clubs]);

  useEffect(() => {
    if (!mapLoadedRef.current || boundsClubs.length === 0) return;

    const dataKey = boundsClubs.length + "|" + boundsClubs.slice(0, 5).map((c) => c.id).join(",");
    if (dataKey === prevFilterRef.current) return;
    prevFilterRef.current = dataKey;

    const lngs = boundsClubs.map((c) => c.longitude);
    const lats = boundsClubs.map((c) => c.latitude);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);

    // If all clubs are at roughly the same point, zoom in tight
    const lngSpan = maxLng - minLng;
    const latSpan = maxLat - minLat;
    if (lngSpan < 0.01 && latSpan < 0.01) {
      mapRef.current?.flyTo({
        center: [(minLng + maxLng) / 2, (minLat + maxLat) / 2],
        zoom: 15,
        duration: 800,
      });
      return;
    }

    mapRef.current?.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      { padding: { top: 60, bottom: 60, left: 60, right: 60 }, duration: 800, maxZoom: 16 }
    );
  }, [boundsClubs]);

  // Find a club by ID from the data array
  const findClub = useCallback(
    (id: number): ClubSearchResult | undefined => {
      return clubs.find((c) => c.id === id);
    },
    [clubs]
  );

  // Handle click on the map layers
  const handleMapClick = useCallback(
    (e: MapLayerMouseEvent) => {
      const mapWrapper = mapRef.current;
      if (!mapWrapper) return;

      const rawMap = mapWrapper.getMap();

      // Check for cluster click
      const clusterFeatures = rawMap.queryRenderedFeatures(e.point, {
        layers: [CLUSTERS_LAYER],
      });

      if (clusterFeatures.length > 0) {
        const feature = clusterFeatures[0];
        const clusterId = feature.properties?.cluster_id;
        const source = rawMap.getSource("clubs") as GeoJSONSource;
        if (source && clusterId != null) {
          source.getClusterExpansionZoom(clusterId, (err, zoom) => {
            if (err || zoom == null) return;
            const geometry = feature.geometry as GeoJSONPoint;
            rawMap.easeTo({
              center: geometry.coordinates as [number, number],
              zoom,
              duration: 500,
            });
          });
        }
        return;
      }

      // Check for unclustered point click
      const pointFeatures = rawMap.queryRenderedFeatures(e.point, {
        layers: [UNCLUSTERED_LAYER, UNCLUSTERED_SELECTED_LAYER],
      });

      if (pointFeatures.length > 0) {
        const props = pointFeatures[0].properties;
        if (props?.id) {
          const club = findClub(props.id);
          if (club) {
            setSelectedClubId(club.id);
            setPopupClub(club);
          }
        }
        return;
      }

      // Clicked on empty space
      setPopupClub(null);
      setSelectedClubId(null);
    },
    [findClub, setSelectedClubId]
  );

  // Change cursor on hoverable layers
  const handleMouseEnter = useCallback(() => {
    const rawMap = mapRef.current?.getMap();
    if (rawMap) rawMap.getCanvas().style.cursor = "pointer";
  }, []);

  const handleMouseLeave = useCallback(() => {
    const rawMap = mapRef.current?.getMap();
    if (rawMap) rawMap.getCanvas().style.cursor = "";
  }, []);

  const handlePopupClose = useCallback(() => {
    setPopupClub(null);
    setSelectedClubId(null);
  }, [setSelectedClubId]);

  const handleMapLoad = useCallback(() => {
    mapLoadedRef.current = true;
    // Set initial bounds once map loads
    const map = mapRef.current;
    if (map) {
      const bounds = map.getBounds();
      if (bounds) {
        setMapBounds({
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
        });
      }
    }
  }, [setMapBounds]);

  // Update map bounds when user pans/zooms (Issue 3)
  const handleMoveEnd = useCallback(
    (_e: ViewStateChangeEvent) => {
      const map = mapRef.current;
      if (!map) return;
      const bounds = map.getBounds();
      if (bounds) {
        setMapBounds({
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
        });
      }
    },
    [setMapBounds]
  );

  // Fly to club when card is clicked (Issue 9)
  useEffect(() => {
    if (!flyToClub || !mapRef.current) return;
    mapRef.current.flyTo({
      center: [flyToClub.lng, flyToClub.lat],
      zoom: 15,
      duration: 800,
    });
    const club = findClub(flyToClub.id);
    if (club) {
      setSelectedClubId(club.id);
      setPopupClub(club);
    }
    setFlyToClub(null);
  }, [flyToClub, findClub, setSelectedClubId, setFlyToClub]);

  return (
    <Map
      ref={mapRef}
      initialViewState={ISRAEL_CENTER}
      style={{ width: "100%", height: "100%" }}
      mapStyle="mapbox://styles/mapbox/streets-v12"
      mapboxAccessToken={MAPBOX_TOKEN}
      onClick={handleMapClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onLoad={handleMapLoad}
      onMoveEnd={handleMoveEnd}
      interactiveLayerIds={[
        CLUSTERS_LAYER,
        UNCLUSTERED_LAYER,
        UNCLUSTERED_SELECTED_LAYER,
      ]}
    >
      <NavigationControl position="top-left" />
      <GeolocateControl position="top-left" trackUserLocation />

      <Source
        id="clubs"
        type="geojson"
        data={geojsonData}
        cluster={true}
        clusterMaxZoom={12}
        clusterRadius={30}
      >
        {/* Cluster circles */}
        <Layer
          id={CLUSTERS_LAYER}
          type="circle"
          filter={["has", "point_count"]}
          paint={{
            "circle-color": [
              "step",
              ["get", "point_count"],
              "#34d399", // emerald-400 for small clusters
              20,
              "#10B981", // emerald-500 for medium
              50,
              "#059669", // emerald-600 for large
            ],
            "circle-radius": [
              "step",
              ["get", "point_count"],
              18, // small
              20,
              24, // medium
              50,
              30, // large
            ],
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          }}
        />

        {/* Cluster count labels */}
        <Layer
          id={CLUSTER_COUNT_LAYER}
          type="symbol"
          filter={["has", "point_count"]}
          layout={{
            "text-field": ["get", "point_count_abbreviated"],
            "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
            "text-size": 13,
          }}
          paint={{
            "text-color": "#ffffff",
          }}
        />

        {/* Unclustered points - selected (rendered below so it's visible) */}
        <Layer
          id={UNCLUSTERED_SELECTED_LAYER}
          type="circle"
          filter={[
            "all",
            ["!", ["has", "point_count"]],
            ["==", ["get", "id"], selectedClubId ?? -1],
          ]}
          paint={{
            "circle-color": "#059669",
            "circle-radius": 9,
            "circle-stroke-width": 2.5,
            "circle-stroke-color": "#ffffff",
          }}
        />

        {/* Unclustered points - default */}
        <Layer
          id={UNCLUSTERED_LAYER}
          type="circle"
          filter={[
            "all",
            ["!", ["has", "point_count"]],
            ["!=", ["get", "id"], selectedClubId ?? -1],
          ]}
          paint={{
            "circle-color": "#10B981",
            "circle-radius": 7,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          }}
        />
      </Source>

      {popupClub && (
        <Popup
          longitude={popupClub.longitude}
          latitude={popupClub.latitude}
          anchor="bottom"
          onClose={handlePopupClose}
          closeOnClick={false}
          className="map-popup"
          maxWidth="280px"
        >
          <div className="p-3 text-right" dir="rtl">
            {/* Top row: logo + name/area */}
            <div className="flex gap-2.5 items-start">
              {popupClub.logoUrl ? (
                <img
                  src={popupClub.logoUrl}
                  alt=""
                  className="w-10 h-10 rounded-lg object-cover shrink-0 bg-stone-100"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center shrink-0">
                  <span className="text-emerald-500 font-bold text-sm">{popupClub.name.charAt(0)}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-stone-900 text-sm leading-tight truncate">
                  {popupClub.name}
                </h3>
                {popupClub.areaName && (
                  <p className="text-xs text-stone-400 mt-0.5 truncate">{popupClub.areaName}</p>
                )}
              </div>
            </div>

            {/* Address */}
            {popupClub.address && (
              <p className="text-xs text-stone-500 mt-2 truncate">{popupClub.address}</p>
            )}

            {/* Badge + price row */}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                {popupClub.clubTypeName && (
                  <span className="text-[11px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full font-medium">
                    {popupClub.clubTypeName}
                  </span>
                )}
              </div>
              {popupClub.price != null && (
                <span className="text-emerald-600 font-bold text-base">
                  {popupClub.price} <span className="text-xs font-medium">₪</span>
                </span>
              )}
            </div>

            {/* Details button */}
            <div className="mt-3 flex justify-start">
              <button
                onClick={() => navigate(`/club/${popupClub.id}`)}
                className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-1.5 rounded-full transition font-medium"
              >
                פרטים
              </button>
            </div>
          </div>
        </Popup>
      )}
    </Map>
  );
}
