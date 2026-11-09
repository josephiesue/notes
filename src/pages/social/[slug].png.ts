import { getCollection } from 'astro:content';
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';

export async function getStaticPaths() {
  const notes = await getCollection('notes', ({ data }) => !data.draft);
  return [
    { params: { slug: 'yes-way' }, props: { title: 'Strength to Serve. Service to Grow.', label: 'A PHILOSOPHY FOR PRACTICE' } },
    ...notes.map(note => ({ params: { slug: note.slug }, props: {
      title: note.data.title,
      label: note.data.iesue ? `IESUE ${String(note.data.iesue).padStart(3, '0')} · THE ${note.data.theme?.toUpperCase() ?? 'YES-WAY'}` : note.data.topic.toUpperCase(),
    } })),
  ];
}
const escape = (text: string) => text.replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[ch]!));
function wrap(title: string) {
  const words = title.split(/\s+/);
  const cache = new Map<number, { lines: string[]; cost: number }>();
  function balance(start: number): { lines: string[]; cost: number } {
    if (start === words.length) return { lines: [], cost: 0 };
    if (cache.has(start)) return cache.get(start)!;
    let best = { lines: [] as string[], cost: Infinity };
    for (let end = start + 1; end <= words.length; end++) {
      const line = words.slice(start, end).join(' ');
      if (line.length > 32 && end > start + 1) break;
      const rest = balance(end);
      const cost = 100000 + (32 - line.length) ** 2 + rest.cost;
      if (cost < best.cost) best = { lines: [line, ...rest.lines], cost };
    }
    cache.set(start, best);
    return best;
  }
  return balance(0).lines;
}
export async function GET({ props }: { props: { title: string; label: string } }) {
  const lines = wrap(props.title);
  if (lines.length > 4) throw new Error(`Social title needs a shorter layout: ${props.title}`);
  const size = lines.length > 3 ? 51 : 60;
  const titleY = lines.length > 3 ? 267 : 285;
  const overlay = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="shade"><stop stop-color="#030912" stop-opacity=".96"/><stop offset=".72" stop-color="#030912" stop-opacity=".87"/><stop offset="1" stop-color="#030912" stop-opacity=".3"/></linearGradient></defs>
    <rect width="1200" height="630" fill="url(#shade)"/>
    <path d="M64 160H1136 M64 530H1136" stroke="#c4a257" stroke-opacity=".6"/>
    <text x="146" y="102" font-family="serif" font-size="34" letter-spacing="3" fill="#f3ecdc">THE YES-WAY</text>
    <text x="64" y="222" font-family="sans-serif" font-size="19" letter-spacing="2.5" fill="#e2c46d">${escape(props.label)}</text>
    ${lines.map((line,i)=>`<text x="61" y="${titleY+i*(size+12)}" font-family="serif" font-size="${size}" fill="#f3ecdc">${escape(line)}</text>`).join('')}
    <text x="64" y="579" font-family="sans-serif" font-size="21" fill="#d1d9e7">Joseph E. Iesue</text>
    <text x="1136" y="579" text-anchor="end" font-family="sans-serif" font-size="19" fill="#e2c46d">notes.josephiesue.com</text>
  </svg>`;
  const emblem = await sharp(await readFile('public/emblem-gold.svg')).resize(68,68).png().toBuffer();
  const image = await sharp('public/images/yes-way-opening-desktop.webp').resize(1200,630,{fit:'cover'})
    .composite([{input:Buffer.from(overlay)},{input:emblem,left:62,top:55}]).png().toBuffer();
  return new Response(image, { headers: { 'Content-Type':'image/png' } });
}
