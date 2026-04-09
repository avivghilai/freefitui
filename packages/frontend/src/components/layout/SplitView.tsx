import { type ReactNode, useState, useCallback } from "react";

interface SplitViewProps {
  list: ReactNode;
  map: ReactNode;
}

export default function SplitView({ list, map }: SplitViewProps) {
  const [mapExpanded, setMapExpanded] = useState(false);

  const handleToggle = useCallback(() => {
    setMapExpanded((prev) => !prev);
    // Let Mapbox know the container changed size after CSS transition
    setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 350);
  }, []);

  return (
    <div className="flex flex-col lg:flex-row app-height mt-16">
      {/* List panel */}
      <div
        className={`order-2 lg:order-1 lg:flex-none lg:w-[38%] xl:w-[35%] overflow-y-auto bg-warm-50 smooth-scroll transition-all duration-300 ${
          mapExpanded ? "h-0 overflow-hidden lg:h-auto lg:overflow-y-auto" : "flex-1"
        }`}
      >
        {list}
      </div>

      {/* Map panel */}
      <div
        className={`order-1 lg:order-2 shrink-0 lg:flex-1 relative transition-all duration-300 ${
          mapExpanded ? "flex-1" : "map-collapsed-height lg:h-auto"
        }`}
      >
        {map}
        {/* Mobile toggle button — sits at bottom of map area */}
        <button
          onClick={handleToggle}
          className="lg:hidden absolute left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm shadow-lg rounded-full px-4 py-2 text-[13px] font-semibold text-warm-800 border border-warm-200/60 flex items-center gap-1.5 z-20 active:scale-95 transition-all"
          style={{ bottom: mapExpanded ? "calc(1.5rem + env(safe-area-inset-bottom, 0px))" : "0.75rem" }}
        >
          {mapExpanded ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
              הצג רשימה
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
              </svg>
              הרחב מפה
            </>
          )}
        </button>
      </div>
    </div>
  );
}
