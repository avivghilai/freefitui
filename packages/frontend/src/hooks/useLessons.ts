import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/api/client";
import type { Lesson } from "@freefitui/shared";

export function useLessons(clubId: number | string) {
  return useQuery({
    queryKey: ["lessons", clubId],
    queryFn: () => fetchApi<Lesson[]>(`/api/clubs/${clubId}/lessons`),
    enabled: !!clubId,
  });
}
