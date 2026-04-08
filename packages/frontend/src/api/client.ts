const API_BASE = import.meta.env.VITE_API_URL || "";

export async function fetchApi<T>(
  path: string,
  params?: Record<string, string>
): Promise<T> {
  const url = new URL(path, API_BASE || window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v) url.searchParams.set(k, v);
    });
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
