import { useEffect } from "react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useSearchStore } from "@/stores/searchStore";

export default function LocationButton() {
  const { lat, lng, loading, error, requestLocation } = useGeolocation();
  const setLocation = useSearchStore((s) => s.setLocation);
  const clearLocation = useSearchStore((s) => s.clearLocation);
  const storeLat = useSearchStore((s) => s.lat);

  const isActive = storeLat != null;

  useEffect(() => {
    if (lat != null && lng != null) {
      setLocation(lat, lng);
    }
  }, [lat, lng, setLocation]);

  const handleClick = () => {
    if (isActive) {
      clearLocation();
    } else {
      requestLocation();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      title={error ?? (isActive ? "ביטול חיפוש לפי מיקום" : "חיפוש לפי מיקום")}
      className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition ${
        isActive
          ? "bg-emerald-500 text-white"
          : "bg-stone-100 text-stone-500 hover:bg-stone-200"
      } ${loading ? "animate-pulse" : ""}`}
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        {/* Crosshair / location icon */}
        <circle cx="12" cy="12" r="3" />
        <path
          strokeLinecap="round"
          d="M12 2v4m0 12v4m10-10h-4M6 12H2"
        />
      </svg>
    </button>
  );
}
