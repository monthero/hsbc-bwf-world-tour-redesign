import { Level } from '~/api/schemas';
import type { SeasonPhase, SeasonSummary, Tournament } from '~/types';
import { today } from '~/utils/dates';
import { plural } from '~/utils/format';
import { isDone, isHeld, isLive } from '~/utils/tournaments';

import type { MonthGroup, StatusFilter } from './types';

const NOW = today();

const CURRENT_MONTH = NOW.month();

const monthIndexes = Array.from({ length: 12 }, (_, m) => m);

export const monthName = (month: number) => NOW.month(month).format('MMMM');

const isRegular = (t: Tournament) => t.level !== 'Finals';
const isOpen = (t: Tournament) => t.status === 'up' || isLive(t);

export const canFilterStatus = (s: SeasonSummary) => s.done > 0 && s.done < s.total;

export const isFiltered = (levels: Level[] | undefined, status: StatusFilter) =>
  (!!levels?.length && levels.length < Level.options.length) || status !== 'all';

const statusMatch = (t: Tournament, status: StatusFilter) => {
  if (status === 'all') return true;
  return status === 'done' ? isDone(t) : isOpen(t);
};

export const filterTournaments = (list: Tournament[], levels: Level[] | undefined, status: StatusFilter) => {
  const lv = levels?.length ? new Set(levels) : null;
  return list.filter((t) => (!lv || lv.has(t.level)) && statusMatch(t, status));
};

const toneOf = (month: number, phase: SeasonPhase): MonthGroup['tone'] => {
  if (phase !== 'current') return phase;
  if (month < CURRENT_MONTH) return 'past';
  return month === CURRENT_MONTH ? 'current' : 'future';
};

export const buildMonths = (
  all: Tournament[],
  list: Tournament[],
  filtered: boolean,
  phase: SeasonPhase,
): MonthGroup[] =>
  monthIndexes.flatMap((month) => {
    const inMonth = all.filter((t) => t.month === month && isRegular(t));
    const items = list.filter((t) => t.month === month && isRegular(t));
    const finalsOnly = !inMonth.length && all.some((t) => t.month === month);
    if (finalsOnly || (filtered && !items.length)) return [];
    const held = inMonth.filter(isHeld);
    return [
      {
        month,
        name: monthName(month),
        items,
        tone: toneOf(month, phase),
        progress: held.length ? Math.round((held.filter(isDone).length / held.length) * 100) : 0,
        muted: !items.some(isOpen),
      },
    ];
  });

export const finalsReached = (t: Tournament, phase: SeasonPhase) =>
  t.status !== 'up' || (phase === 'current' && CURRENT_MONTH >= t.month);

export const eventCountLabel = (n: number) => (n ? plural(n, 'event') : '—');

export const heroSubtitle = (finals: Tournament, phase: SeasonPhase, isMobile: boolean) => {
  const past = phase === 'past';
  const dates = past ? finals.datesLong : finals.dates;
  if (isMobile) return `World Tour Finals · ${dates}`;
  return `Every stop ${past ? 'led' : 'leads'} to the World Tour Finals, ${dates}`;
};
