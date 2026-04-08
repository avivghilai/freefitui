import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/api/client";
import type { ClubSearchResponse } from "@freefitui/shared";
import { useSearchStore } from "@/stores/searchStore";

export function useMapClubs() {
  const { query, cityId, categoryId, lat, lng, radius } = useSearchStore();

  return useQuery({
    queryKey: ["mapClubs", { query, cityId, categoryId, lat, lng, radius }],
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
      params.limit = "500";
      params.page = "1";
      return fetchApi<ClubSearchResponse>("/api/clubs", params);
    },
    staleTime: 30000,
  });
}
