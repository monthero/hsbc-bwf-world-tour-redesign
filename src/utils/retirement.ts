import type { EditionRef } from '~/types';

import { formatDayMonthYear, formatMonth } from './dates';

export interface RetirementFacts {
  since?: string;
  lastPlayed?: string;
  lastTournament?: EditionRef | null;
}

export interface RetirementRow {
  label: string;
  value: string;
}

export const RETIRED_FROM = 'Retired from international badminton';

export const editionLabel = (e: EditionRef) => `${e.name} ${e.year}`;

export const retirementSince = ({ since }: RetirementFacts) => (since ? `Since ${formatMonth(since)}` : '');

export const retirementRows = ({ lastPlayed, lastTournament }: RetirementFacts): RetirementRow[] =>
  [
    lastTournament && { label: 'Last tour event', value: editionLabel(lastTournament) },
    lastPlayed && { label: 'Last tour match', value: formatDayMonthYear(lastPlayed) },
  ].filter((r): r is RetirementRow => !!r);

export const retirementParts = (facts: RetirementFacts) =>
  [
    facts.since && `${RETIRED_FROM} since ${formatMonth(facts.since)}`,
    ...retirementRows(facts).map((r) => `${r.label}: ${r.value}`),
  ].filter((s): s is string => !!s);

export const retirementNote = (facts: RetirementFacts) => retirementParts(facts).join(' · ');
