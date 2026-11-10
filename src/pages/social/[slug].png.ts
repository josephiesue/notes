import { getCollection } from 'astro:content';
import { renderCard, cardDataFor, SITE_CARD, type CardData } from '../../lib/social-card';

// 1200×630 link-preview image (og:image / twitter:image)
export async function getStaticPaths() {
  const notes = await getCollection('notes', ({ data }) => !data.draft);
  return [
    { params: { slug: 'yes-way' }, props: { card: SITE_CARD } },
    ...notes.map((note) => ({ params: { slug: note.slug }, props: { card: cardDataFor(note) } })),
  ];
}
export async function GET({ props }: { props: { card: CardData } }) {
  return new Response(await renderCard('og', props.card), { headers: { 'Content-Type': 'image/png' } });
}
