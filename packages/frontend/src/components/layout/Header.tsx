import SearchBar from "@/components/search/SearchBar";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white/95 backdrop-blur-md border-b border-warm-200/60 flex items-center px-5 gap-4">
      <a href="/" className="shrink-0 flex items-center gap-1.5 group">
        <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
          </svg>
        </div>
        <span className="font-display text-xl font-extrabold text-warm-900 tracking-tight">
          Free<span className="text-emerald-500">Fit</span>
        </span>
      </a>

      <div className="flex-1 max-w-xl">
        <SearchBar />
      </div>
    </header>
  );
}
