import { useClubs } from "@/hooks/useClubs";
import { useSearchStore } from "@/stores/searchStore";
import ClubCard from "./ClubCard";

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 flex gap-3 animate-pulse">
      <div className="w-12 h-12 rounded-lg bg-stone-200 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-stone-200 rounded w-2/3" />
        <div className="h-3 bg-stone-200 rounded w-1/3" />
        <div className="h-3 bg-stone-200 rounded w-1/4" />
      </div>
    </div>
  );
}

export default function ClubList() {
  const { data, isLoading, isError } = useClubs();
  const page = useSearchStore((s) => s.page);
  const setPage = useSearchStore((s) => s.setPage);

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center text-stone-500">
        שגיאה בטעינת המועדונים
      </div>
    );
  }

  if (!data?.clubs.length) {
    return (
      <div className="p-8 text-center text-stone-500">לא נמצאו תוצאות</div>
    );
  }

  const totalPages = Math.ceil(data.total / data.limit);

  return (
    <div className="p-4 space-y-3">
      <p className="text-sm text-stone-500 px-1">
        {data.total} מועדונים
      </p>

      {data.clubs.map((club) => (
        <ClubCard key={club.id} club={club} />
      ))}

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-4 pb-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1.5 text-sm rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            הקודם
          </button>
          <span className="text-sm text-stone-500">
            {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1.5 text-sm rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            הבא
          </button>
        </div>
      )}
    </div>
  );
}
