import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/api/client";
import type { ClubDetail } from "@freefitui/shared";

export function useClubDetail(id: number | string) {
  return useQuery({
    queryKey: ["club", id],
    queryFn: () => fetchApi<ClubDetail>(`/api/clubs/${id}`),
    enabled: !!id,
  });
}
