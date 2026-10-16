import { msg } from '@lingui/core/macro';

import { translate } from '~/i18n/lazy';
import type { EditionRef } from '~/types';

import { formatDayMonthYear, formatMonth } from './dates';
import { joinDots, labelValue } from './format';

export interface RetirementFacts {
  since?: string;
  lastPlayed?: string;
  lastTournament?: EditionRef | null;
}

export interface RetirementRow {
  label: string;
  value: string;
}

export const RETIRED_FROM = msg({
  message: 'Retired from international badminton',
  comment: 'Player profile badge title: the player has ended their international career',
});

const RETIRED_SINCE = msg({
  message: 'Retired from international badminton since {month}',
  comment: 'The player ended their international career in this month, e.g. "… since March 2024"',
});

const SINCE = msg({
  message: 'Since {month}',
  comment: 'Under "Retired from international badminton": since which month, e.g. "Since March 2024"',
});

const LAST_EVENT = msg({
  message: 'Last tour event',
  comment: 'Retired player: the last World Tour tournament they played',
});

const LAST_MATCH = msg({
  message: 'Last tour match',
  comment: 'Retired player: the date of the last World Tour match they played',
});

const editionLabel = (e: EditionRef) => `${e.name} ${e.year}`;

export const retirementSince = ({ since }: RetirementFacts) =>
  since ? translate(SINCE, { month: formatMonth(since) }) : '';

export const retirementRows = ({ lastPlayed, lastTournament }: RetirementFacts): RetirementRow[] =>
  [
    lastTournament && { label: translate(LAST_EVENT), value: editionLabel(lastTournament) },
    lastPlayed && { label: translate(LAST_MATCH), value: formatDayMonthYear(lastPlayed) },
  ].filter((r): r is RetirementRow => !!r);

export const retirementParts = (facts: RetirementFacts) =>
  [
    facts.since && translate(RETIRED_SINCE, { month: formatMonth(facts.since) }),
    ...retirementRows(facts).map((r) => labelValue(r.label, r.value)),
  ].filter((s): s is string => !!s);

export const retirementNote = (facts: RetirementFacts) => joinDots(retirementParts(facts));
