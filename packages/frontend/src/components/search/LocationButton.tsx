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
      className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
        isActive
          ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/25 hover:bg-emerald-600"
          : "bg-warm-100 text-warm-800 hover:bg-warm-200 hover:text-emerald-600"
      } ${loading ? "animate-gentle-pulse" : ""}`}
    >
      <svg
        className="w-[18px] h-[18px]"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="3" />
        <path strokeLinecap="round" d="M12 2v4m0 12v4m10-10h-4M6 12H2" />
      </svg>
    </button>
  );
}
