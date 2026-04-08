import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/api/client";
import type { City } from "@freefitui/shared";

export function useCities() {
  return useQuery({
    queryKey: ["cities"],
    queryFn: () => fetchApi<City[]>("/api/cities"),
    staleTime: Infinity,
  });
}
