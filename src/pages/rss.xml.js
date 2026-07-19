import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const notes = (await getCollection('notes', ({ data }) => !data.draft)).sort((a,b)=>b.data.date.valueOf()-a.data.date.valueOf());
  return rss({
    title: 'The Yes-Way — Joseph E. Iesue',
    description: 'Strength to serve. Service to grow. Published Iesues from Joseph E. Iesue.',
    site: context.site,
    items: notes.map(note => ({ title:note.data.title, description:note.data.description, pubDate:note.data.date, link:`/${note.slug}/` })),
  });
}
