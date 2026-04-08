import { useCategories } from "@/hooks/useCategories";
import { useSearchStore } from "@/stores/searchStore";

export default function CategoryFilter() {
  const { data: categories, isLoading } = useCategories();
  const categoryId = useSearchStore((s) => s.categoryId);
  const setCategoryId = useSearchStore((s) => s.setCategoryId);

  if (isLoading) {
    return (
      <div className="flex gap-2 py-3 px-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-8 w-20 rounded-full bg-stone-200 animate-pulse shrink-0"
          />
        ))}
      </div>
    );
  }

  if (!categories?.length) return null;

  return (
    <div className="flex gap-2 py-3 px-4 overflow-x-auto scrollbar-hide">
      <button
        onClick={() => setCategoryId(null)}
        className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition ${
          categoryId === null
            ? "bg-emerald-500 text-white"
            : "bg-stone-100 text-stone-600 hover:bg-stone-200"
        }`}
      >
        הכל
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() =>
            setCategoryId(categoryId === cat.id ? null : cat.id)
          }
          className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition ${
            categoryId === cat.id
              ? "bg-emerald-500 text-white"
              : "bg-stone-100 text-stone-600 hover:bg-stone-200"
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
