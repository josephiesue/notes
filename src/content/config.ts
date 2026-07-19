import { defineCollection, z } from 'astro:content';

const notes = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    format: z.enum(['iesue', 'practical', 'seminar', 'case', 'marginalia']),
    iesue: z.number().int().min(1).optional(),
    updated: z.coerce.date().optional(),
    topic: z.string(),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }).superRefine((note, context) => {
    if (note.format === 'iesue' && note.iesue === undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['iesue'],
        message: 'A numbered Iesue must include an iesue number.',
      });
    }
    if (note.format !== 'iesue' && note.iesue !== undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['iesue'],
        message: 'Only full Iesues receive an iesue number.',
      });
    }
  }),
});

export const collections = { notes };
