import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/api/client";

interface CategoryItem {
  id: number;
  name: string;
  count?: number;
  subcategories: { id: number; name: string }[];
}

interface CategoryResponse {
  categories: CategoryItem[];
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
