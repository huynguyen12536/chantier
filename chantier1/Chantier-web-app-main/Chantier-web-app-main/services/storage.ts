import { apiUrl } from '@/services/supabase';

let cachedUrls: string[] | null = null;

export async function fetchWorksiteImageUrls(): Promise<string[]> {
  if (cachedUrls?.length) return cachedUrls;
  try {
    const res = await fetch(`${apiUrl}/api/storage/worksite-images`);
    if (!res.ok) throw new Error(`storage list ${res.status}`);
    const body = (await res.json()) as { urls?: string[] };
    cachedUrls = body.urls?.length ? body.urls : null;
  } catch {
    cachedUrls = null;
  }
  return cachedUrls ?? [];
}

export function getWorksiteImageUrl(index: number): string {
  const safe = Number.isFinite(index) ? Math.max(0, index) : 0;
  return `${apiUrl}/api/storage/worksite-images/${safe}`;
}

export async function resolveWorksiteImageUrl(index: number): Promise<string> {
  const urls = await fetchWorksiteImageUrls();
  if (urls.length) return urls[index % urls.length];
  return getWorksiteImageUrl(index);
}
