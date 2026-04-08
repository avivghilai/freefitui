import { useCategories } from "@/hooks/useCategories";
import { useSearchStore } from "@/stores/searchStore";

export default function CategoryFilter() {
  const { data: categories, isLoading } = useCategories();
  const categoryId = useSearchStore((s) => s.categoryId);
  const setCategoryId = useSearchStore((s) => s.setCategoryId);

  if (isLoading) {
    return (
      <div className="flex gap-2 py-3 px-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-9 w-20 rounded-xl skeleton shrink-0" />
        ))}
      </div>
    );
  }

  if (!categories?.length) return null;

  return (
    <div className="flex gap-2 py-3 px-4 overflow-x-auto scrollbar-hide border-b border-warm-200/40">
      <button
        onClick={() => setCategoryId(null)}
        className={`shrink-0 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all duration-200 ${
          categoryId === null
            ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/25"
            : "bg-white text-warm-800/70 border border-warm-200/60 hover:border-emerald-400/40 hover:text-emerald-600"
        }`}
      >
        הכל
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => setCategoryId(categoryId === cat.id ? null : cat.id)}
          className={`shrink-0 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all duration-200 ${
            categoryId === cat.id
              ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/25"
              : "bg-white text-warm-800/70 border border-warm-200/60 hover:border-emerald-400/40 hover:text-emerald-600"
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
