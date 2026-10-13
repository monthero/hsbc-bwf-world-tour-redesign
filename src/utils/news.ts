import type { NewsImage, NewsItem } from '~/api/schemas';
import type { Tournament } from '~/types';

import { date, formatDayMonth, hoursSince } from './dates';

const CLOUDINARY = 'https://res.cloudinary.com/badminton/image/upload/f_auto,q_auto';

export type NewsRatio = 'wide' | 'card' | 'natural';

const RATIOS: Record<Exclude<NewsRatio, 'natural'>, number> = { wide: 9 / 16, card: 3 / 4 };

const transform = (width: number, ratio: NewsRatio) =>
  ratio === 'natural' ? `c_limit,w_${width}` : `c_fill,g_auto,w_${width},h_${Math.round(width * RATIOS[ratio])}`;

export const newsImageUrl = (image: NewsImage, width: number, ratio: NewsRatio) =>
  `${CLOUDINARY},${transform(width, ratio)}/v${image.v}/${image.id}.${image.ext}`;

export const newsImageSrcSet = (image: NewsImage, widths: readonly number[], ratio: NewsRatio) =>
  widths.map((w) => `${newsImageUrl(image, w, ratio)} ${w}w`).join(', ');

const KIND_PREFIXES = new Set(['where to watch', 'smashing stats', 'preview', 'talking points', 'in numbers']);

const fold = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

export const tournamentKey = (year: number, name: string) => `${year}|${fold(name)}`;

export type TournamentLookup = {
  byCode: ReadonlyMap<string, Tournament>;
  byName: ReadonlyMap<string, Tournament>;
  byYear: ReadonlyMap<number, readonly Tournament[]>;
};

export interface NewsStory {
  item: NewsItem;
  title: string;
  kind: string | null;
  tournament: Tournament | null;
  fresh: boolean;
  when: string;
}

const FRESH_HOURS = 24;

const splitPrefix = (title: string) => {
  const i = title.indexOf(': ');
  return i > 0 ? { prefix: title.slice(0, i), rest: title.slice(i + 2) } : null;
};

const timeLabel = (iso: string, hours: number) => {
  if (hours < 1) return 'Just now';
  if (hours < FRESH_HOURS) return `${Math.floor(hours)}h ago`;
  return formatDayMonth(iso);
};

export const toStory = (item: NewsItem, lookup: TournamentLookup | undefined): NewsStory => {
  const year = date(item.publishedAt).year();
  const split = splitPrefix(item.title);
  const kind = split && KIND_PREFIXES.has(fold(split.prefix)) ? split.prefix : null;
  const coded = item.tournaments.map((c) => lookup?.byCode.get(c)).find(Boolean);
  const named = split && !kind ? lookup?.byName.get(tournamentKey(year, split.prefix)) : undefined;
  const mentioned =
    split && kind ? lookup?.byYear.get(year)?.find((t) => fold(split.rest).includes(fold(t.name))) : undefined;
  const tournament = coded ?? named ?? mentioned ?? null;
  const stripPrefix = !!split && (!!kind || (!!tournament && fold(split.prefix) === fold(tournament.name)));
  const hours = hoursSince(item.publishedAt);
  return {
    item,
    title: stripPrefix && split ? split.rest : item.title,
    kind,
    tournament,
    fresh: hours < FRESH_HOURS,
    when: timeLabel(item.publishedAt, hours),
  };
};
