import { useState, useCallback, useRef, useEffect } from "react";
import { useSearchStore } from "@/stores/searchStore";

export default function SearchBar() {
  const setQuery = useSearchStore((s) => s.setQuery);
  const [value, setValue] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setValue(v);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setQuery(v);
      }, 300);
    },
    [setQuery]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="relative">
      <svg
        className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" strokeLinecap="round" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="חיפוש מועדון, עיר או פעילות..."
        className="w-full rounded-full bg-stone-100 pr-10 pl-4 py-2 text-sm text-stone-900 placeholder:text-stone-400 outline-none transition focus:bg-white focus:ring-2 focus:ring-emerald-500/30"
      />
    </div>
  );
}
