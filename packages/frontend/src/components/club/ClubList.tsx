import { useClubs } from "@/hooks/useClubs";
import { useSearchStore } from "@/stores/searchStore";
import ClubCard from "./ClubCard";

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-4 flex gap-3.5 items-center border border-transparent">
      <div className="w-14 h-14 rounded-xl skeleton shrink-0" />
      <div className="flex-1 space-y-2.5">
        <div className="h-4 skeleton w-3/4" />
        <div className="h-3 skeleton w-2/5" />
        <div className="h-3 skeleton w-1/4" />
      </div>
      <div className="w-8 h-8 skeleton rounded-lg" />
    </div>
  );
}

export default function ClubList() {
  const { data, isLoading, isError } = useClubs();
  const page = useSearchStore((s) => s.page);
  const setPage = useSearchStore((s) => s.setPage);
  const query = useSearchStore((s) => s.query);

  if (isLoading) {
    return (
      <div className="p-4 space-y-2.5">
        <div className="h-4 skeleton w-24 mx-1 mb-1" />
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
        </div>
        <p className="text-warm-800/60 text-sm font-medium">שגיאה בטעינת המועדונים</p>
        <p className="text-warm-800/40 text-xs mt-1">נסו שוב מאוחר יותר</p>
      </div>
    );
  }

  if (!data?.clubs.length) {
    return (
      <div className="p-12 text-center">
        <div className="w-14 h-14 rounded-2xl bg-warm-100 flex items-center justify-center mx-auto mb-3">
          <svg className="w-7 h-7 text-warm-800/30" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
        </div>
        <p className="text-warm-800/60 text-sm font-medium">לא נמצאו תוצאות</p>
        {query && (
          <p className="text-warm-800/40 text-xs mt-1">
            נסו לחפש במילים אחרות או לשנות את הסינון
          </p>
        )}
      </div>
    );
  }

  const totalPages = Math.ceil(data.total / data.limit);

  return (
    <div className="p-4 space-y-2.5 smooth-scroll">
      <div className="flex items-center justify-between px-1 mb-1">
        <p className="text-[13px] text-warm-800/50 font-medium">
          <span className="text-warm-900 font-semibold">{data.total.toLocaleString()}</span> מועדונים
        </p>
        {totalPages > 1 && (
          <p className="text-[11px] text-warm-800/40">
            עמוד {page} מתוך {totalPages}
          </p>
        )}
      </div>

      {data.clubs.map((club, i) => (
        <ClubCard key={club.id} club={club} index={i} />
      ))}

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 pt-4 pb-2">
          <button
            disabled={page <= 1}
            onClick={() => { setPage(page - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="px-4 py-2 text-sm rounded-xl bg-white border border-warm-200/80 text-warm-800 hover:bg-warm-50 hover:border-emerald-400/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 font-medium"
          >
            הקודם
          </button>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = page <= 3 ? i + 1 : page + i - 2;
              if (p < 1 || p > totalPages) return null;
              return (
                <button
                  key={p}
                  onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-all duration-200 ${
                    p === page
                      ? "bg-emerald-500 text-white shadow-sm"
                      : "text-warm-800/50 hover:bg-warm-100"
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>
          <button
            disabled={page >= totalPages}
            onClick={() => { setPage(page + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="px-4 py-2 text-sm rounded-xl bg-white border border-warm-200/80 text-warm-800 hover:bg-warm-50 hover:border-emerald-400/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 font-medium"
          >
            הבא
          </button>
        </div>
      )}
    </div>
  );
}
