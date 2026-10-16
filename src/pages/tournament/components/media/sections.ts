import { i18n } from '@lingui/core';
import { t } from '@lingui/core/macro';

import type { MediaItem, MediaKind } from '~/api/schemas';
import { ROUND_ORDER } from '~/constants';
import type { Match, Tournament } from '~/types';
import { date } from '~/utils/dates';
import { matchesQuery, normQuery, roundName } from '~/utils/matches';
import { foldText } from '~/utils/names';

import { LIVE_NOW } from '../../constants';

interface MediaGroup {
  key: string;
  label: string | null;
  items: MediaItem[];
}

export interface MediaSection {
  key: string;
  title: string;
  count: number;
  groups: MediaGroup[];
}

const TOP_PLAYS: ReadonlySet<MediaKind> = new Set(['play_of_the_day', 'top_shots']);
const MORE: ReadonlySet<MediaKind> = new Set(['short', 'promo', 'other']);
const UNLINKED = 'other';

const groupBy = (
  items: readonly MediaItem[],
  keyOf: (item: MediaItem) => string,
  labelOf: (key: string) => string | null,
  order: (a: string, b: string) => number,
): MediaGroup[] =>
  [...Map.groupBy(items, keyOf)]
    .toSorted(([a], [b]) => order(a, b))
    .map(([key, list]) => ({ key, label: labelOf(key), items: list }));

const roundRank = (r: string) => (r === UNLINKED ? -1 : (ROUND_ORDER[r] ?? 0));

export const mediaRound = (item: MediaItem, matchOf: ReadonlyMap<string, Match>) =>
  matchOf.get(item.id)?.round ?? item.round ?? null;

const byRound = (items: readonly MediaItem[], matchOf: ReadonlyMap<string, Match>, other: string) =>
  groupBy(
    items,
    (i) => mediaRound(i, matchOf) ?? UNLINKED,
    (k) => (k === UNLINKED ? other : roundName(k)),
    (a, b) => roundRank(b) - roundRank(a),
  );

const NO_COURT = 99;

const byCourt = (a: MediaItem, b: MediaItem) => (a.court ?? NO_COURT) - (b.court ?? NO_COURT);

const bySchedule = (a: MediaItem, b: MediaItem) => (a.scheduledAt ?? '').localeCompare(b.scheduledAt ?? '');

const dayLabel = (start: string, day: string) => {
  const when = date(start)
    .add(Number(day) - 1, 'day')
    .format('ddd D MMM');
  return t({
    message: `Day ${day} · ${when}`,
    comment: 'Media tab group of court streams for one tournament day, e.g. "Day 2 · Wed 15 Oct"',
  });
};

const byDay = (items: readonly MediaItem[], tn: Tournament) =>
  groupBy(
    items.toSorted(byCourt),
    (i) => String(i.day ?? 0),
    (k) => dayLabel(tn.start, k),
    (a, b) => Number(a) - Number(b),
  );

const single = (items: MediaItem[]): MediaGroup[] => [{ key: 'all', label: null, items }];

const section = (key: string, title: string, groups: MediaGroup[]): MediaSection => ({
  key,
  title,
  count: groups.reduce((n, g) => n + g.items.length, 0),
  groups,
});

export const buildMediaSections = (
  items: readonly MediaItem[],
  matchOf: ReadonlyMap<string, Match>,
  tn: Tournament,
): MediaSection[] => {
  const live = items.filter((i) => i.live === 'live').toSorted(byCourt);
  const upcoming = items.filter((i) => i.live === 'upcoming').toSorted(bySchedule);
  const rest = items.filter((i) => i.live === 'none');
  const of = (kind: MediaKind) => rest.filter((i) => i.kind === kind);
  return [
    section('live', i18n._(LIVE_NOW), single(live)),
    section(
      'upcoming',
      t({ message: 'Upcoming streams', comment: 'Media tab section: live streams that haven’t started yet' }),
      single(upcoming),
    ),
    section(
      'highlights',
      t({ message: 'Highlights', comment: 'Media tab section: short highlight videos of matches' }),
      byRound(
        of('highlights'),
        matchOf,
        t({ message: 'More highlights', comment: 'Media tab group of highlight videos not linked to a round' }),
      ),
    ),
    section(
      'full',
      t({ message: 'Full matches', comment: 'Media tab section: videos of whole matches' }),
      byRound(
        of('full_match'),
        matchOf,
        t({ message: 'More matches', comment: 'Media tab group of full-match videos not linked to a round' }),
      ),
    ),
    section(
      'top',
      t({ message: 'Top plays', comment: 'Media tab section: best rallies and shots of the day' }),
      single(rest.filter((i) => TOP_PLAYS.has(i.kind))),
    ),
    section(
      'courts',
      t({ message: 'Court streams', comment: 'Media tab section: full-day live streams of each court' }),
      byDay(of('court_stream'), tn),
    ),
    section(
      'more',
      t({ message: 'More videos', comment: 'Media tab section: other videos such as shorts and promos' }),
      single(rest.filter((i) => MORE.has(i.kind))),
    ),
  ].filter((s) => s.count > 0);
};

const textOf = (item: MediaItem, match: Match | undefined) => {
  if (item.sides) return foldText(item.sides.flat().join(' '));
  return match ? '' : foldText(item.title);
};

export const mediaMatchesQuery = (item: MediaItem, matchOf: ReadonlyMap<string, Match>, q: string) => {
  const s = normQuery(q);
  if (!s) return true;
  const match = matchOf.get(item.id);
  const text = textOf(item, match);
  return (!!match && matchesQuery(match, s)) || s.split(/\s+/).every((w) => text.includes(w));
};

export const mediaRounds = (items: readonly MediaItem[], matchOf: ReadonlyMap<string, Match>) =>
  [...new Set(items.map((i) => mediaRound(i, matchOf)).filter((r) => r !== null))].toSorted(
    (a, b) => roundRank(b) - roundRank(a),
  );
