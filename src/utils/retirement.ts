import type { EditionRef } from '~/types';

import { formatDayMonthYear, formatMonth } from './dates';

export interface RetirementFacts {
  since?: string;
  lastPlayed?: string;
  lastTournament?: EditionRef | null;
}

export const editionLabel = (e: EditionRef) => `${e.name} ${e.year}`;

export const retirementParts = ({ since, lastPlayed, lastTournament }: RetirementFacts) =>
  [
    since && `Retired since ${formatMonth(since)}`,
    lastTournament && `Last tournament: ${editionLabel(lastTournament)}`,
    lastPlayed && `Last played ${formatDayMonthYear(lastPlayed)}`,
  ].filter((s): s is string => !!s);

export const retirementNote = (facts: RetirementFacts) => retirementParts(facts).join(' · ');
