import { getCollection } from 'astro:content';
import { renderCard, cardDataFor, SITE_CARD, type CardData } from '../../../lib/social-card';

// /social/square/<slug>.png  1080×1350 feed post
// /social/story/<slug>.png   1080×1920 story
export async function getStaticPaths() {
  const notes = await getCollection('notes', ({ data }) => !data.draft);
  const cards: { slug: string; card: CardData }[] = [
    { slug: 'yes-way', card: SITE_CARD },
    ...notes.map((note) => ({ slug: note.slug, card: cardDataFor(note) })),
  ];
  return (['square', 'story'] as const).flatMap((format) =>
    cards.map(({ slug, card }) => ({ params: { format, slug }, props: { format, card } })));
}
export async function GET({ props }: { props: { format: 'square' | 'story'; card: CardData } }) {
  return new Response(await renderCard(props.format, props.card), { headers: { 'Content-Type': 'image/png' } });
}
