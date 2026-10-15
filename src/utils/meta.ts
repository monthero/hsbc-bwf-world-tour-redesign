import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';

import type { NewsArticle } from '~/api/schemas';
import { EVENT_NAMES } from '~/constants';
import type { EventCode, Player, RankingKind, RankView, Tournament, TournamentStatus } from '~/types';

import { countryName } from './countries';
import { formatList } from './format';
import { playerHeroUrl, playerSquareUrl, playerThumbUrl } from './images';
import { newsImageUrl } from './news';

export type Translate = (descriptor: MessageDescriptor) => string;

export type MetaText = string | MessageDescriptor;

export type MetaType = 'website' | 'article' | 'profile';

export interface DocumentMeta {
  title?: MetaText;
  description?: MetaText;
  image?: string;
  type?: MetaType;
}

export const SITE_NAME = msg({
  message: 'HSBC BWF World Tour',
  comment: 'Site name in browser tabs and link previews; the official tour brand, usually kept in English',
});

export const PAGE_TITLE = msg({
  message: '{page} · {site}',
  comment: 'Browser tab title. {page} is the page name (a tournament, player or section), {site} is the site name',
});

export const SITE_DESCRIPTION = msg({
  message:
    'Live scores, draws, results, the season calendar, world rankings and news from the HSBC BWF World Tour, badminton’s top tournament circuit.',
  comment: 'Default page description for search engines and link previews',
});

export const NOT_FOUND_META: DocumentMeta = {
  title: msg({
    message: 'Page not found',
    comment: 'Browser tab title for a missing page, tournament, player or story',
  }),
  description: msg({
    message: 'This page isn’t on the HSBC BWF World Tour site. The link may be broken or out of date.',
    comment: 'Page description for a missing page',
  }),
};

export const ERROR_DESCRIPTION = msg({
  message: 'This page couldn’t be loaded right now.',
  comment: 'Shown, and used as the page description, when a page fails to load',
});

export const ERROR_META: DocumentMeta = {
  title: msg({ message: 'Something went wrong', comment: 'Browser tab title when a page fails to load' }),
  description: ERROR_DESCRIPTION,
};

export const ABOUT_PAGE_META: DocumentMeta = {
  title: msg({ message: 'About', comment: 'Browser tab title for the page explaining how the World Tour works' }),
  description: msg({
    message:
      'How the HSBC BWF World Tour works: tournament levels, ranking points, the season so far and the race to the World Tour Finals.',
    comment: 'Page description for the About page',
  }),
};

export const NEWS_PAGE_META: DocumentMeta = {
  title: msg({ message: 'News', comment: 'Browser tab title for the news index' }),
  description: msg({
    message: 'Match reports, previews and stats from every stop on the HSBC BWF World Tour.',
    comment: 'Page description for the news index',
  }),
};

export const RANKINGS_PAGE_META: Record<RankingKind, DocumentMeta> = {
  world: {
    title: msg({ message: 'World rankings', comment: 'Browser tab title for the BWF World Rankings page' }),
    description: msg({
      message:
        'BWF World Rankings in men’s and women’s singles, men’s and women’s doubles and mixed doubles, with weekly movement.',
      comment: 'Page description for the BWF World Rankings page',
    }),
  },
  race: {
    title: msg({
      message: 'Race to Finals',
      comment: 'Browser tab title for the standings of the race to qualify for the World Tour Finals',
    }),
    description: msg({
      message:
        'Race to the HSBC BWF World Tour Finals: who is on course to qualify in each of the five disciplines this season.',
      comment: 'Page description for the Race to Finals standings',
    }),
  },
};

const CALENDAR_TITLE = msg({
  message: 'Calendar {year}',
  comment: 'Browser tab title for a season calendar. {year} is the season, e.g. 2026',
});

const CALENDAR_DESCRIPTION = msg({
  message:
    'The {year} HSBC BWF World Tour calendar: every tournament with its dates, host city, level and live status.',
  comment: 'Page description for a season calendar. {year} is the season, e.g. 2026',
});

export const calendarMeta = (_: Translate, year: number): DocumentMeta => ({
  title: _({ ...CALENDAR_TITLE, values: { year } }),
  description: _({ ...CALENDAR_DESCRIPTION, values: { year } }),
});

const TOURNAMENT_DESCRIPTIONS: Record<TournamentStatus, MessageDescriptor> = {
  up: msg({
    message: '{name}, a {level} tournament in {place}, {dates}. See the players, draw and schedule.',
    comment:
      'Description of an upcoming tournament. {name} e.g. "VICTOR Denmark Open 2026", {level} e.g. "Super 750", {place} e.g. "Odense, Denmark", {dates} e.g. "13–18 October 2026"',
  }),
  live: msg({
    message: 'Live now: {name}, a {level} tournament in {place}, {dates}. Follow live scores, the draw and results.',
    comment:
      'Description of a tournament being played right now. {name} e.g. "VICTOR Denmark Open 2026", {level} e.g. "Super 750", {place} e.g. "Odense, Denmark", {dates} e.g. "13–18 October 2026"',
  }),
  done: msg({
    message: '{name}, a {level} tournament in {place}, {dates}. See the champions, results and draw.',
    comment:
      'Description of a finished tournament. {name} e.g. "VICTOR Denmark Open 2026", {level} e.g. "Super 750", {place} e.g. "Odense, Denmark", {dates} e.g. "13–18 October 2026"',
  }),
  cancelled: msg({
    message: '{name}, a {level} tournament in {place} planned for {dates}, was cancelled.',
    comment:
      'Description of a cancelled tournament. {name} e.g. "VICTOR Denmark Open 2026", {level} e.g. "Super 750", {place} e.g. "Odense, Denmark", {dates} e.g. "13–18 October 2026"',
  }),
};

export const tournamentMeta = (_: Translate, t: Tournament): DocumentMeta => ({
  title: t.heading,
  description: _({
    ...TOURNAMENT_DESCRIPTIONS[t.status],
    values: { name: t.heading, level: t.levelLabel, place: t.place, dates: t.datesLong },
  }),
  image: t.header,
});

const PLAYER_RANK = msg({
  message: '{discipline} world No. {rank}',
  comment: 'One world ranking of a player, e.g. "Men’s singles world No. 1"',
});

const PLAYER_RANKED = msg({
  message: '{name} from {country}: {rankings}. Profile, results, matches and ranking history.',
  comment:
    'Description of a ranked player. {name} e.g. "Viktor Axelsen", {country} e.g. "Denmark", {rankings} e.g. "Men’s singles world No. 1"',
});

const PLAYER_EVENTS = msg({
  message: '{name} from {country}: {disciplines}. Profile, results, matches and ranking history.',
  comment:
    'Description of an unranked player. {name} e.g. "Kento Momota", {country} e.g. "Japan", {disciplines} e.g. "Men’s singles"',
});

const PLAYER_BASIC = msg({
  message: '{name} from {country}. Profile, results, matches and ranking history.',
  comment:
    'Description of a player with no ranking or matches yet. {name} e.g. "Viktor Axelsen", {country} e.g. "Denmark"',
});

const playerDescription = (_: Translate, player: Player, ranks: readonly RankView[], events: readonly EventCode[]) => {
  const values = { name: player.name, country: countryName(player.cc) };
  const ranked = ranks.filter((r) => r.rank);
  if (ranked.length)
    return _({
      ...PLAYER_RANKED,
      values: {
        ...values,
        rankings: formatList(
          ranked.map((r) => _({ ...PLAYER_RANK, values: { discipline: EVENT_NAMES[r.ev], rank: r.rank } })),
        ),
      },
    });
  if (events.length)
    return _({ ...PLAYER_EVENTS, values: { ...values, disciplines: formatList(events.map((ev) => EVENT_NAMES[ev])) } });
  return _({ ...PLAYER_BASIC, values });
};

export const playerMeta = (
  _: Translate,
  player: Player,
  ranks: readonly RankView[],
  events: readonly EventCode[],
  photos: { hero: string | null | undefined; photo: string | null | undefined },
): DocumentMeta => ({
  title: player.name,
  description: playerDescription(_, player, ranks, events),
  image: photos.hero
    ? playerHeroUrl(player.id, photos.hero, false)
    : playerSquareUrl(playerThumbUrl(photos.photo)) || undefined,
  type: 'profile',
});

const ARTICLE_IMAGE_WIDTH = 1200;

export const articleMeta = (article: NewsArticle): DocumentMeta => ({
  title: article.title,
  description: article.excerpt ?? NEWS_PAGE_META.description,
  image: article.image ? newsImageUrl(article.image, ARTICLE_IMAGE_WIDTH, 'wide') : undefined,
  type: 'article',
});
