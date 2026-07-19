export type PublicationFormat = 'iesue' | 'practical' | 'seminar' | 'case' | 'marginalia';

const fullLabels: Record<Exclude<PublicationFormat, 'iesue'>, string> = {
  practical: 'Practical Note',
  seminar: 'Seminar Note',
  case: 'Case Note',
  marginalia: 'Marginalia',
};

const shortLabels: Record<Exclude<PublicationFormat, 'iesue'>, string> = {
  practical: 'Practical',
  seminar: 'Seminar',
  case: 'Case',
  marginalia: 'Marginalia',
};

export function publicationLabel(format: PublicationFormat, iesue?: number) {
  if (format === 'iesue') return `Iesue №${String(iesue ?? 0).padStart(3, '0')}`;
  return fullLabels[format];
}

export function publicationShortLabel(format: PublicationFormat, iesue?: number) {
  if (format === 'iesue') return `№${String(iesue ?? 0).padStart(3, '0')}`;
  return shortLabels[format];
}
