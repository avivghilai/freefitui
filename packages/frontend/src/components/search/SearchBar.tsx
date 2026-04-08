import { useState, useCallback, useRef, useEffect } from "react";
import { useSearchStore } from "@/stores/searchStore";

export default function SearchBar() {
  const setQuery = useSearchStore((s) => s.setQuery);
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
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
    <div className={`relative transition-all duration-200 ${focused ? "scale-[1.01]" : ""}`}>
      <svg
        className={`absolute right-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] pointer-events-none transition-colors duration-200 ${
          focused ? "text-emerald-500" : "text-warm-200"
        }`}
        fill="none"
        stroke="currentColor"
        strokeWidth={2.2}
        viewBox="0 0 24 24"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" strokeLinecap="round" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="חיפוש מועדון, עיר או פעילות..."
        className="w-full rounded-xl bg-warm-100 pr-11 pl-4 py-2.5 text-sm text-warm-900 placeholder:text-warm-200 outline-none transition-all duration-200 border border-transparent focus:bg-white focus:border-emerald-500/30 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.08)]"
      />
    </div>
  );
}
