import Header from "@/components/layout/Header";
import SplitView from "@/components/layout/SplitView";
import CategoryFilter from "@/components/search/CategoryFilter";
import ClubList from "@/components/club/ClubList";
import MapView from "@/components/map/MapView";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-warm-50">
      <Header />
      <SplitView
        list={
          <>
            <CategoryFilter />
            <ClubList />
          </>
        }
        map={<MapView />}
      />
    </div>
  );
}
