import type { Digest } from './types';

const TIMEOUT_MS = 15_000;

/** Is dit een briefing in de vorm die de app verwacht? Wat van buiten komt, vertrouwen we niet blind. */
export function isDigest(x: unknown): x is Digest {
  if (!x || typeof x !== 'object') return false;
  const d = x as Record<string, unknown>;
  if (typeof d.gemaaktOp !== 'number' || !Array.isArray(d.stories) || !Array.isArray(d.items)) return false;
  const itemsOk = d.items.every(
    (i) => i && typeof i.id === 'string' && typeof i.titel === 'string' && typeof i.link === 'string' && /^https?:\/\//i.test(i.link),
  );
  const storiesOk = d.stories.every(
    (s) =>
      s &&
      typeof s.id === 'string' &&
      typeof s.titel === 'string' &&
      typeof s.watGebeurt === 'string' &&
      Array.isArray(s.itemIds) &&
      Array.isArray(s.kansen),
  );
  return itemsOk && storiesOk && d.stories.length > 0;
}

/**
 * Haalt de klaargezette briefing op. Geeft null als er geen (geldige) is;
 * de app toont dan gewoon wat ze al had.
 */
export async function haalBriefing(url: string): Promise<Digest | null> {
  if (!/^https:\/\//i.test(url)) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    // De tijdsparameter omzeilt tussenopslag, zodat een nieuwe briefing meteen zichtbaar is.
    const res = await fetch(`${url}${url.includes('?') ? '&' : '?'}t=${Math.floor(Date.now() / 300_000)}`, {
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    if (!isDigest(data)) return null;
    return { ...data, gezienIds: Array.isArray(data.gezienIds) ? data.gezienIds : [] };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
