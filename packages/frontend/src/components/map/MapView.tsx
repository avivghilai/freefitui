import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Map, { Marker, Popup, NavigationControl } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useMapClubs } from "@/hooks/useMapClubs";
import { useSearchStore } from "@/stores/searchStore";
import type { ClubSearchResult } from "@freefitui/shared";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const MAX_MARKERS = 200;

const ISRAEL_CENTER = {
  longitude: 34.8,
  latitude: 31.5,
  zoom: 7.5,
};

function ClubMarker({
  club,
  isSelected,
  onClick,
}: {
  club: ClubSearchResult;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <Marker
      longitude={club.longitude}
      latitude={club.latitude}
      anchor="center"
      onClick={(e) => {
        e.originalEvent.stopPropagation();
        onClick();
      }}
    >
      <svg
        width={isSelected ? 16 : 12}
        height={isSelected ? 16 : 12}
        viewBox="0 0 12 12"
        className="cursor-pointer transition-transform"
        style={{ transform: isSelected ? "scale(1.3)" : undefined }}
      >
        <circle
          cx="6"
          cy="6"
          r="5"
          fill={isSelected ? "#059669" : "#10B981"}
          stroke="white"
          strokeWidth="2"
        />
      </svg>
    </Marker>
  );
}

export default function MapView() {
  const navigate = useNavigate();
  const { data } = useMapClubs();
  const selectedClubId = useSearchStore((s) => s.selectedClubId);
  const setSelectedClubId = useSearchStore((s) => s.setSelectedClubId);

  const [popupClub, setPopupClub] = useState<ClubSearchResult | null>(null);

  const clubs = useMemo(() => {
    if (!data?.clubs) return [];
    return data.clubs.slice(0, MAX_MARKERS);
  }, [data]);

  const handleMarkerClick = useCallback(
    (club: ClubSearchResult) => {
      setSelectedClubId(club.id);
      setPopupClub(club);
    },
    [setSelectedClubId]
  );

  const handlePopupClose = useCallback(() => {
    setPopupClub(null);
    setSelectedClubId(null);
  }, [setSelectedClubId]);

  return (
    <Map
      initialViewState={ISRAEL_CENTER}
      style={{ width: "100%", height: "100%" }}
      mapStyle="mapbox://styles/mapbox/light-v11"
      mapboxAccessToken={MAPBOX_TOKEN}
      onClick={handlePopupClose}
    >
      <NavigationControl position="top-left" />

      {clubs.map((club) => (
        <ClubMarker
          key={club.id}
          club={club}
          isSelected={selectedClubId === club.id}
          onClick={() => handleMarkerClick(club)}
        />
      ))}

      {popupClub && (
        <Popup
          longitude={popupClub.longitude}
          latitude={popupClub.latitude}
          anchor="bottom"
          onClose={handlePopupClose}
          closeOnClick={false}
          className="map-popup"
          maxWidth="240px"
        >
          <div className="p-1 text-right" dir="rtl">
            <h3 className="font-semibold text-stone-900 text-sm leading-tight">
              {popupClub.name}
            </h3>
            {popupClub.clubTypeName && (
              <span className="inline-block text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full mt-1">
                {popupClub.clubTypeName}
              </span>
            )}
            {popupClub.price != null && (
              <p className="text-emerald-600 font-semibold text-sm mt-1">
                {popupClub.price} ₪
              </p>
            )}
            <button
              onClick={() => navigate(`/club/${popupClub.id}`)}
              className="mt-2 w-full text-center text-xs bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg transition font-medium"
            >
              פרטים
            </button>
          </div>
        </Popup>
      )}
    </Map>
  );
}
