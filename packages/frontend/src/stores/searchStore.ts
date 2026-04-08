import { create } from "zustand";

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface FlyToClub {
  lat: number;
  lng: number;
  id: number;
}

export interface SearchState {
  query: string;
  cityId: number | null;
  categoryId: number | null;
  lat: number | null;
  lng: number | null;
  radius: number;
  page: number;
  selectedClubId: number | null;
  mapBounds: MapBounds | null;
  flyToClub: FlyToClub | null;
  setQuery: (q: string) => void;
  setCityId: (id: number | null) => void;
  setCategoryId: (id: number | null) => void;
  setLocation: (lat: number, lng: number) => void;
  clearLocation: () => void;
  setPage: (p: number) => void;
  setSelectedClubId: (id: number | null) => void;
  setMapBounds: (bounds: MapBounds | null) => void;
  setFlyToClub: (target: FlyToClub | null) => void;
  resetFilters: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  query: "",
  cityId: null,
  categoryId: null,
  lat: null,
  lng: null,
  radius: 10,
  page: 1,
  selectedClubId: null,
  mapBounds: null,
  flyToClub: null,

  setQuery: (query) => set({ query, page: 1 }),
  setCityId: (cityId) => set({ cityId, page: 1 }),
  setCategoryId: (categoryId) => set({ categoryId, page: 1 }),
  setLocation: (lat, lng) => set({ lat, lng, page: 1 }),
  clearLocation: () => set({ lat: null, lng: null }),
  setPage: (page) => set({ page }),
  setSelectedClubId: (selectedClubId) => set({ selectedClubId }),
  setMapBounds: (mapBounds) => set({ mapBounds, page: 1 }),
  setFlyToClub: (flyToClub) => set({ flyToClub }),
  resetFilters: () =>
    set({
      query: "",
      cityId: null,
      categoryId: null,
      lat: null,
      lng: null,
      radius: 10,
      page: 1,
      selectedClubId: null,
      mapBounds: null,
      flyToClub: null,
    }),
}));
