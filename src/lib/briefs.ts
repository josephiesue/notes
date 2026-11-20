/**
 * Enterprise Briefs, pulled from entr.cc at build time.
 * Feed: https://entr.cc/enterprise/briefs/rss.xml
 * The site rebuilds daily (see .github/workflows/deploy.yml), so new briefs appear within a day.
 * If the feed can't be reached, a saved snapshot (src/data/briefs-fallback.json) is used instead.
 */
import fallback from '../data/briefs-fallback.json';

export const BRIEFS_FEED = 'https://entr.cc/enterprise/briefs/rss.xml';
export const BRIEFS_HOME = 'https://entr.cc/enterprise/briefs/';

export interface Brief { title: string; link: string; date: Date; description: string; categories: string[]; number?: string; }

const decode = (s: string) => s
  .replace(/^<!\[CDATA\[([\s\S]*?)\]\]>$/, '$1')
  .replace(/<[^>]+>/g, '')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
  .replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ')
  .trim();
const tag = (xml: string, name: string) => { const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`)); return m ? decode(m[1].trim()) : ''; };
const tags = (xml: string, name: string) => [...xml.matchAll(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'g'))].map((m) => decode(m[1].trim()));

// Brief number from the URL slug, e.g. /briefs/002-fourth-grade-reading/ -> "002"
const numberOf = (link: string) => link.match(/\/briefs\/(\d{3})-/)?.[1];
// Sample/demo briefs stay off this site
const isSample = (b: Brief) => /sample/i.test(b.link) || /^sample\b/i.test(b.title);

export function parseFeed(xml: string, linkPrefix: string): Brief[] {
  return [...xml.matchAll(/<item[\s>][\s\S]*?<\/item>/g)].map(([item]) => {
    const link = tag(item, 'link') || tag(item, 'guid');
    return { title: tag(item, 'title'), link, date: new Date(tag(item, 'pubDate')), description: tag(item, 'description'), categories: tags(item, 'category'), number: numberOf(link) };
  }).filter((b) => b.title && b.link.startsWith(linkPrefix) && !Number.isNaN(b.date.valueOf()));
}

let cache: Promise<Brief[]> | undefined;
export function getBriefs(limit = 4): Promise<Brief[]> {
  cache ??= (async () => {
    try {
      const res = await fetch(BRIEFS_FEED, { signal: AbortSignal.timeout(10000), headers: { 'User-Agent': 'notes.josephiesue.com build' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const items = parseFeed(await res.text(), BRIEFS_HOME);
      if (!items.length) throw new Error('feed had no items');
      return items;
    } catch (error) {
      console.warn(`[briefs] live feed unavailable (${(error as Error).message}); using saved snapshot`);
      return fallback.items.map((b) => ({ ...b, date: new Date(b.date), number: numberOf(b.link) }));
    }
  })();
  return cache.then((items) => items.filter((b) => !isSample(b)).sort((a, b) => b.date.valueOf() - a.date.valueOf()).slice(0, limit));
}
