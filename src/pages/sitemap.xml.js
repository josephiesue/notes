import { getCollection } from 'astro:content';

export const prerender = true;

const site = 'https://notes.josephiesue.com';
const topicSlug = (value) => value.toLowerCase().replace(/\s+/g, '-');
const escapeXml = (value) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;');
const formatDate = (date) => date.toISOString().slice(0, 10);

export async function GET() {
  const notes = await getCollection('notes', ({ data }) => !data.draft);
  const latestNoteDate = notes.reduce((latest, note) => {
    const date = note.data.updated ?? note.data.date;
    return !latest || date > latest ? date : latest;
  }, undefined);
  const topicDates = new Map();

  for (const note of notes) {
    const slug = topicSlug(note.data.topic);
    const date = note.data.updated ?? note.data.date;
    const current = topicDates.get(slug);
    if (!current || date > current) topicDates.set(slug, date);
  }

  const entries = [
    { path: '/', lastmod: latestNoteDate },
    { path: '/about/' },
    { path: '/archive/', lastmod: latestNoteDate },
    { path: '/topics/', lastmod: latestNoteDate },
    ...notes.map((note) => ({
      path: `/${note.slug}/`,
      lastmod: note.data.updated ?? note.data.date,
    })),
    ...[...topicDates.entries()].map(([slug, lastmod]) => ({
      path: `/topics/${slug}/`,
      lastmod,
    })),
  ];

  const urls = entries.map(({ path, lastmod }) => {
    const location = escapeXml(new URL(path, site).href);
    const modified = lastmod ? `\n    <lastmod>${formatDate(lastmod)}</lastmod>` : '';
    return `  <url>\n    <loc>${location}</loc>${modified}\n  </url>`;
  }).join('\n');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

  return new Response(sitemap, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
