import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/api/client";

interface CategoryResponse {
  categories: { id: number; name: string; subcategories: { id: number; name: string }[] }[];
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const resp = await fetchApi<CategoryResponse>("/api/categories");
      return resp.categories;
    },
    staleTime: Infinity,
  });
}
