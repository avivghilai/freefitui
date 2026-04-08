import SearchBar from "@/components/search/SearchBar";
import LocationButton from "@/components/search/LocationButton";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white shadow-sm flex items-center px-4 gap-3">
      <a href="/" className="shrink-0">
        <span className="text-xl font-bold text-emerald-600 tracking-tight">
          FreeFit
        </span>
      </a>
      <div className="flex-1 max-w-xl">
        <SearchBar />
      </div>
      <LocationButton />
    </header>
  );
}
