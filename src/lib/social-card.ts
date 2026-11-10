/**
 * Social share cards for The Yes-Way.
 * Three formats, all rendered at build time with the brand fonts:
 *   og     1200×630   link previews (LinkedIn, X, Facebook, WhatsApp, iMessage, Slack)
 *   square 1080×1350  Instagram / LinkedIn / Threads feed post (4:5)
 *   story  1080×1920  Instagram / Threads / WhatsApp story (9:16)
 * Backgrounds are stills of the live Three.js scene (src/assets/social-bg, see tools/).
 */
import satori from 'satori';
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';

export type CardKind = 'og' | 'square' | 'story';
export interface CardData { label: string; title: string; description?: string; }

const SIZES: Record<CardKind, [number, number]> = { og: [1200, 630], square: [1080, 1350], story: [1080, 1920] };
const INK = '#f3ecdc';
const SOFT = '#d3cabb';
const MUTED = '#9aa5ba';
const GOLD = '#e2c46d';
const BG = '4,7,13';

let fontCache: Awaited<ReturnType<typeof loadFonts>> | undefined;
async function loadFonts() {
  const f = (pkg: string, file: string) => readFile(`node_modules/@fontsource/${pkg}/files/${file}`);
  return [
    { name: 'Cinzel', data: await f('cinzel', 'cinzel-latin-600-normal.woff'), weight: 600 as const, style: 'normal' as const },
    { name: 'Spectral', data: await f('spectral', 'spectral-latin-400-normal.woff'), weight: 400 as const, style: 'normal' as const },
    { name: 'Spectral', data: await f('spectral', 'spectral-latin-400-italic.woff'), weight: 400 as const, style: 'italic' as const },
    { name: 'Archivo', data: await f('archivo', 'archivo-latin-600-normal.woff'), weight: 600 as const, style: 'normal' as const },
  ];
}

let emblemCache: string | undefined;
async function emblem() {
  emblemCache ??= `data:image/svg+xml;base64,${(await readFile('public/emblem-gold.svg')).toString('base64')}`;
  return emblemCache;
}

// tiny element helper for satori's object syntax
type Node = { type: string; props: Record<string, unknown> };
const h = (type: string, style: Record<string, unknown>, ...children: (Node | string | null)[]): Node =>
  ({ type, props: { style, children: children.filter((c) => c !== null) } });
const img = (src: string, size: number): Node => ({ type: 'img', props: { src, width: size, height: size, style: { width: size, height: size } } });

function titleSize(kind: CardKind, title: string) {
  const n = title.length;
  if (kind === 'og') return n <= 26 ? 62 : n <= 44 ? 54 : 46;
  if (kind === 'square') return n <= 26 ? 76 : n <= 44 ? 66 : 56;
  return n <= 26 ? 84 : n <= 44 ? 74 : 64;
}

function wordmark(src: string, size: number, text: number): Node {
  return h('div', { display: 'flex', alignItems: 'center', gap: Math.round(size * 0.38) },
    img(src, size),
    h('div', { display: 'flex', fontFamily: 'Cinzel', fontSize: text, letterSpacing: text * 0.14, color: INK }, 'THE YES-WAY'));
}

const rule = (opacity = 0.55): Node => h('div', { display: 'flex', height: 1, width: '100%', backgroundColor: `rgba(226,196,109,${opacity})` });

function layout(kind: CardKind, d: CardData, logo: string): Node {
  const [w, hgt] = SIZES[kind];
  const label = h('div', { display: 'flex', fontFamily: 'Archivo', fontWeight: 600, fontSize: kind === 'og' ? 18 : 24, letterSpacing: kind === 'og' ? 3.5 : 5, color: GOLD }, d.label.toUpperCase());
  const title = h('div', { display: 'flex', fontFamily: 'Cinzel', fontWeight: 600, fontSize: titleSize(kind, d.title), lineHeight: 1.08, color: INK, letterSpacing: 0.5 }, d.title);
  const desc = d.description && kind !== 'og'
    ? h('div', { display: 'flex', fontFamily: 'Spectral', fontStyle: 'italic', fontSize: kind === 'story' ? 38 : 33, lineHeight: 1.45, color: SOFT }, d.description)
    : null;
  const site = h('div', { display: 'flex', fontFamily: 'Archivo', fontWeight: 600, fontSize: kind === 'og' ? 19 : 24, letterSpacing: 2, color: GOLD }, 'notes.josephiesue.com');
  const byline = h('div', { display: 'flex', fontFamily: 'Spectral', fontSize: kind === 'og' ? 22 : 28, color: MUTED }, 'Joseph E. Iesue');

  if (kind === 'og') {
    return h('div', {
      display: 'flex', flexDirection: 'column', width: w, height: hgt, padding: '52px 64px 46px',
      backgroundImage: `linear-gradient(90deg, rgba(${BG},.95) 0%, rgba(${BG},.86) 46%, rgba(${BG},.25) 66%, rgba(${BG},0) 80%)`,
    },
      wordmark(logo, 46, 26),
      h('div', { display: 'flex', flexDirection: 'column', gap: 20, width: 660, marginTop: 'auto', marginBottom: 'auto' }, label, title),
      rule(0.4),
      h('div', { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }, byline, site));
  }

  const story = kind === 'story';
  return h('div', {
    display: 'flex', flexDirection: 'column', width: w, height: hgt,
    padding: story ? '230px 84px 260px' : '64px 80px 70px',
    backgroundImage: `linear-gradient(180deg, rgba(${BG},0) 0%, rgba(${BG},0) ${story ? 40 : 38}%, rgba(${BG},.78) ${story ? 54 : 52}%, rgba(${BG},.96) 72%)`,
  },
    story ? h('div', { display: 'flex', justifyContent: 'center' }, wordmark(logo, 48, 30)) : wordmark(logo, 46, 28),
    h('div', { display: 'flex', flexDirection: 'column', gap: story ? 34 : 26, marginTop: 'auto' },
      label, title, desc, rule(0.45),
      h('div', { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, byline, site),
      story ? h('div', { display: 'flex', justifyContent: 'center', marginTop: 26, fontFamily: 'Cinzel', fontSize: 30, letterSpacing: 3, color: GOLD }, 'STRENGTH TO SERVE. SERVICE TO GROW.') : null));
}

export async function renderCard(kind: CardKind, data: CardData): Promise<Buffer> {
  fontCache ??= await loadFonts();
  const [w, h] = SIZES[kind];
  const svg = await satori(layout(kind, data, await emblem()) as any, { width: w, height: h, fonts: fontCache });
  return sharp(`src/assets/social-bg/${kind}.jpg`)
    .resize(w, h, { fit: 'cover' })
    .composite([{ input: Buffer.from(svg) }])
    .png({ compressionLevel: 9, palette: false })
    .toBuffer();
}

/** Card copy for a note, shared by every format. */
export function cardDataFor(note: { data: { title: string; description: string; format: string; iesue?: number; theme?: string; topic: string } }): CardData {
  const d = note.data;
  const label = d.format === 'iesue'
    ? `Iesue ${String(d.iesue).padStart(3, '0')} · The ${d.theme ?? 'Yes-Way'}`
    : `${{ practical: 'Practical Note', seminar: 'Seminar Note', case: 'Case Note', marginalia: 'Marginalia' }[d.format] ?? 'Note'} · ${d.topic}`;
  return { label, title: d.title, description: d.description };
}

export const SITE_CARD: CardData = {
  label: 'A philosophy for practice',
  title: 'Strength to Serve. Service to Grow.',
  description: 'A letter for people building strength, choosing responsibility, and putting their work in service of something larger.',
};
