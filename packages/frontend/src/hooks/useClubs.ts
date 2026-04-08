import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/api/client";
import { useSearchStore } from "@/stores/searchStore";
import type { ClubSearchResponse } from "@freefitui/shared";

export function useClubs() {
  const { query, cityId, categoryId, lat, lng, radius, page, mapBounds } =
    useSearchStore();

  return useQuery({
    queryKey: ["clubs", { query, cityId, categoryId, lat, lng, radius, page, mapBounds }],
    queryFn: () => {
      const params: Record<string, string> = {};
      if (query) params.q = query;
      if (cityId) params.city = String(cityId);
      if (categoryId) params.category = String(categoryId);
      if (lat && lng) {
        params.lat = String(lat);
        params.lng = String(lng);
        params.radius = String(radius);
      }
      // Only send map bounds when there's no text query
      if (mapBounds && !query) {
        params.north = String(mapBounds.north);
        params.south = String(mapBounds.south);
        params.east = String(mapBounds.east);
        params.west = String(mapBounds.west);
      }
      params.page = String(page);
      params.limit = "20";
      return fetchApi<ClubSearchResponse>("/api/clubs", params);
    },
  });
}
