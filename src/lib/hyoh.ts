/**
 * Hike Your Own Hike (HYOH), pulled from Substack at build time.
 * Feed: https://hyoh.substack.com/feed. Refreshed by the same daily rebuild as the Briefs.
 * If the feed can't be reached, src/data/hyoh-fallback.json is used instead.
 */
import fallback from '../data/hyoh-fallback.json';
import { parseFeed, type Brief } from './briefs';

export const HYOH_FEED = 'https://hyoh.substack.com/feed';
export const HYOH_HOME = 'https://hyoh.substack.com/';
export type HyohPost = Brief;

let cache: Promise<HyohPost[]> | undefined;
export function getHyohPosts(limit = 2): Promise<HyohPost[]> {
  cache ??= (async () => {
    try {
      const res = await fetch(HYOH_FEED, { signal: AbortSignal.timeout(10000), headers: { 'User-Agent': 'notes.josephiesue.com build' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const items = parseFeed(await res.text(), HYOH_HOME + 'p/');
      if (!items.length) throw new Error('feed had no items');
      return items;
    } catch (error) {
      console.warn(`[hyoh] live feed unavailable (${(error as Error).message}); using saved snapshot`);
      return fallback.items.map((p) => ({ ...p, date: new Date(p.date) }));
    }
  })();
  return cache.then((items) => [...items].sort((a, b) => b.date.valueOf() - a.date.valueOf()).slice(0, limit));
}
