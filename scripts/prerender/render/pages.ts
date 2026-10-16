import { EventCode, Level, type NewsItem, type RankingKind, type RankingPlayer } from '~/api/schemas';
import { EVENT_NAMES, LEVEL_META, SEASON_YEAR } from '~/constants';
import { eventsOf } from '~/pages/player/utils';
import type { Player, PlayerMatch, Tournament } from '~/types';
import { countryName } from '~/utils/countries';
import { formatDayMonthYear } from '~/utils/dates';
import { formatRank, joinDots } from '~/utils/format';
import {
  ABOUT_PAGE_META,
  articleMeta,
  calendarMeta,
  NEWS_PAGE_META,
  playerMeta,
  RANKINGS_PAGE_META,
  tournamentMeta,
  type DocumentMeta,
  type MetaText,
  type ResolvedDocumentMeta,
  type Translate,
} from '~/utils/meta';
import { toPlayer } from '~/utils/names';
import { buildRanks } from '~/utils/rankings';
import { hasWinners, isHeld, knownFinalsCity } from '~/utils/tournaments';

import type { Store } from './data';
import { esc, link, list, section } from './document';

export interface Ctx {
  _: Translate;
  store: Store;
  href: (path: string) => string;
  text: (value: MetaText | undefined) => string;
}

export interface Crumb {
  name: string;
  path: string;
}

export interface PageView {
  meta: DocumentMeta;
  body: string;
  crumbs: readonly Crumb[];
  jsonLd?: (meta: ResolvedDocumentMeta, url: string) => object[];
}

const SCHEMA = 'https://schema.org';
const BWF = { '@type': 'Organization', name: 'Badminton World Federation', url: 'https://bwfbadminton.com' };
const RANKING_ROWS = 10;
const NEWS_ITEMS = 20;
const TOURNAMENT_NEWS = 5;
const RECENT_TOURNAMENTS = 8;
const ARTICLE_PARAGRAPHS = 3;

export const calendarPath = (year: number) => (year === SEASON_YEAR ? '/calendar' : `/calendar?year=${year}`);
const rankingsPath = (kind: RankingKind) => (kind === 'race' ? '/rankings?kind=race' : '/rankings');
const tournamentPath = (t: Pick<Tournament, 'year' | 'slug'>) => `/world-tour/${t.year}/${encodeURIComponent(t.slug)}`;
const playerPath = (id: string) => `/players/${encodeURIComponent(id)}`;
const articlePath = (id: string) => `/news/${encodeURIComponent(id)}`;

const time = (iso: string) => `<time datetime="${esc(iso)}">${esc(formatDayMonthYear(iso))}</time>`;

const paragraph = (html: string) => (html ? `<p>${html}</p>` : '');

const playerLink = (ctx: Ctx, p: Player) => (p.id ? link(ctx.href(playerPath(p.id)), p.name) : esc(p.name));

const tournamentItem = (ctx: Ctx, t: Tournament, facts: readonly (string | null | undefined)[]) => {
  const item = joinDots([link(ctx.href(tournamentPath(t)), t.heading), esc(joinDots(facts))]);
  return t.cancelled ? `<del>${item}</del>` : item;
};

const articleItem = (ctx: Ctx, n: Pick<NewsItem, 'id' | 'title' | 'publishedAt'>) =>
  joinDots([link(ctx.href(articlePath(n.id)), n.title), time(n.publishedAt)]);

const calendarLink = (ctx: Ctx, year: number) =>
  link(ctx.href(calendarPath(year)), ctx.text(calendarMeta(ctx._, year).title));

const calendarPage = (ctx: Ctx, year: number): PageView | null => {
  const tournaments = ctx.store.tournaments(year);
  if (!tournaments) return null;
  const meta = calendarMeta(ctx._, year);
  const seasons = (ctx.store.seasons()?.seasons ?? []).filter((s) => s.year !== year);
  return {
    meta,
    body:
      list(tournaments.map((t) => tournamentItem(ctx, t, [t.datesLong, t.place, t.levelLabel]))) +
      list(seasons.map((s) => calendarLink(ctx, s.year))),
    crumbs: [{ name: ctx.text(meta.title), path: calendarPath(year) }],
  };
};

const rankingsPage = (ctx: Ctx, kind: RankingKind): PageView | null => {
  const table = ctx.store.ranking(kind);
  if (!table) return null;
  const meta = RANKINGS_PAGE_META[kind];
  const person = (p: RankingPlayer) => `${playerLink(ctx, toPlayer(p.name, p.cc, p.id))} (${esc(countryName(p.cc))})`;
  const events = EventCode.options.map((ev) =>
    section(
      EVENT_NAMES[ev],
      list(
        (table.categories[ev] ?? [])
          .slice(0, RANKING_ROWS)
          .map((row) => `${formatRank(row.rank)} ${row.players.map(person).join(' / ')}`),
      ),
    ),
  );
  return {
    meta,
    body: paragraph(esc(joinDots([table.name, formatDayMonthYear(table.publication.date)]))) + events.join(''),
    crumbs: [{ name: ctx.text(meta.title), path: rankingsPath(kind) }],
  };
};

const newsPage = (ctx: Ctx): PageView => ({
  meta: NEWS_PAGE_META,
  body: list((ctx.store.newsIndex()?.latest ?? []).slice(0, NEWS_ITEMS).map((n) => articleItem(ctx, n))),
  crumbs: [{ name: ctx.text(NEWS_PAGE_META.title), path: '/news' }],
});

const aboutPage = (ctx: Ctx): PageView => {
  const season = (ctx.store.tournaments(SEASON_YEAR) ?? []).filter(isHeld);
  const levels = Level.options.map((level) =>
    section(
      LEVEL_META[level].long,
      list(season.filter((t) => t.level === level).map((t) => tournamentItem(ctx, t, [t.datesLong, t.place]))),
    ),
  );
  return {
    meta: ABOUT_PAGE_META,
    body: levels.join(''),
    crumbs: [{ name: ctx.text(ABOUT_PAGE_META.title), path: '/about' }],
  };
};

const sportsEvent = (t: Tournament) => (meta: ResolvedDocumentMeta, url: string) => [
  {
    '@context': SCHEMA,
    '@type': 'SportsEvent',
    name: t.heading,
    description: meta.description,
    url,
    image: meta.image,
    startDate: t.start,
    endDate: t.end,
    eventStatus: `${SCHEMA}/${t.cancelled ? 'EventCancelled' : 'EventScheduled'}`,
    eventAttendanceMode: `${SCHEMA}/OfflineEventAttendanceMode`,
    sport: 'Badminton',
    location: {
      '@type': 'Place',
      name: t.venue || t.place,
      address: {
        '@type': 'PostalAddress',
        addressLocality: knownFinalsCity(t) ?? undefined,
        addressCountry: t.country || undefined,
      },
    },
    organizer: BWF,
  },
];

const tournamentPage = (ctx: Ctx, year: number, slug: string): PageView | null => {
  const season = ctx.store.tournaments(year);
  const t = season?.find((x) => x.slug === slug);
  if (!season || !t) return null;
  const held = season.filter(isHeld);
  const index = held.indexOf(t);
  const neighbours = index < 0 ? [] : [held[index - 1], held[index + 1]];
  const champions = hasWinners(t)
    ? t.champions.map((c) => `${esc(EVENT_NAMES[c.event])}: ${c.players.map((p) => playerLink(ctx, p)).join(' / ')}`)
    : [];
  const news = (ctx.store.tournamentNews(t.code)?.items ?? []).slice(0, TOURNAMENT_NEWS);
  return {
    meta: tournamentMeta(ctx._, t),
    body:
      list(
        [t.datesLong, t.place, t.venue, t.levelLabel, t.prize ? t.prizeLabel : null].flatMap((v) =>
          v ? [esc(v)] : [],
        ),
      ) +
      list(champions) +
      list(news.map((n) => articleItem(ctx, n))) +
      list([...neighbours.flatMap((n) => (n ? [tournamentItem(ctx, n, [n.datesLong])] : [])), calendarLink(ctx, year)]),
    crumbs: [
      { name: ctx.text(calendarMeta(ctx._, year).title), path: calendarPath(year) },
      { name: t.heading, path: tournamentPath(t) },
    ],
    jsonLd: sportsEvent(t),
  };
};

const playerPage = (ctx: Ctx, id: string): PageView | null => {
  const directory = ctx.store.directory();
  const record = directory.get(id);
  const file = ctx.store.player(id);
  const name = record?.name ?? file?.name;
  if (name === undefined) return null;
  const player = toPlayer(name, record?.cc ?? file?.cc ?? '', id);
  const ranks = buildRanks(record?.ranks ?? [], undefined, undefined, undefined, directory);
  const matches = file?.matches ?? [];
  const events = eventsOf(matches.map((match) => ({ match })) as unknown as PlayerMatch[]);
  const meta = playerMeta(ctx._, player, ranks, events, { hero: file?.hero, photo: record?.photo ?? file?.photo });
  const ranked = ranks.flatMap((r) =>
    r.rank ? [joinDots([esc(EVENT_NAMES[r.ev]), formatRank(r.rank), r.partner && playerLink(ctx, r.partner)])] : [],
  );
  const recent = [...new Set(matches.toSorted((a, b) => b.day.localeCompare(a.day)).map((m) => m.tournament))]
    .slice(0, RECENT_TOURNAMENTS)
    .flatMap((code) => {
      const t = ctx.store.tournament(code);
      return t ? [tournamentItem(ctx, t, [t.datesLong])] : [];
    });
  const bio = file?.bio;
  return {
    meta,
    body: paragraph(esc(countryName(player.cc))) + list(ranked) + list(recent),
    crumbs: [
      { name: ctx.text(RANKINGS_PAGE_META.world.title), path: rankingsPath('world') },
      { name: player.name, path: playerPath(id) },
    ],
    jsonLd: (resolved, url) => [
      {
        '@context': SCHEMA,
        '@type': 'Person',
        name: player.name,
        description: resolved.description,
        url,
        image: resolved.image,
        nationality: player.cc ? { '@type': 'Country', name: countryName(player.cc) } : undefined,
        birthDate: bio?.born || undefined,
        height: bio?.height ? { '@type': 'QuantitativeValue', value: bio.height, unitCode: 'CMT' } : undefined,
      },
    ],
  };
};

const articlePage = (ctx: Ctx, id: string): PageView | null => {
  const article = ctx.store.article(id);
  if (!article) return null;
  const directory = ctx.store.directory();
  const paragraphs = article.blocks
    .flatMap((b) => (b.type === 'paragraph' ? [b.runs.map((r) => r.text).join('')] : []))
    .filter((p) => p.trim() && p !== article.excerpt)
    .slice(0, ARTICLE_PARAGRAPHS);
  const tournaments = article.tournaments.flatMap((code) => {
    const t = ctx.store.tournament(code);
    return t ? [link(ctx.href(tournamentPath(t)), t.heading)] : [];
  });
  const players = article.players.flatMap((pid) => {
    const record = directory.get(pid);
    return record ? [playerLink(ctx, toPlayer(record.name, record.cc, pid))] : [];
  });
  return {
    meta: articleMeta(article),
    body:
      paragraph(joinDots([time(article.publishedAt), article.byline && esc(article.byline)])) +
      paragraphs.map((p) => paragraph(esc(p))).join('') +
      list(tournaments) +
      list(players) +
      paragraph(link(article.url, new URL(article.url).hostname)),
    crumbs: [
      { name: ctx.text(NEWS_PAGE_META.title), path: '/news' },
      { name: article.title, path: articlePath(id) },
    ],
    jsonLd: (resolved, url) => [
      {
        '@context': SCHEMA,
        '@type': 'NewsArticle',
        headline: article.title,
        description: resolved.description,
        url,
        mainEntityOfPage: url,
        image: resolved.image,
        datePublished: article.publishedAt,
        author: article.byline ? { '@type': 'Person', name: article.byline } : BWF,
        publisher: BWF,
        isBasedOn: article.url,
        inLanguage: 'en',
      },
    ],
  };
};

export const navLinks = (ctx: Ctx) =>
  list([
    calendarLink(ctx, SEASON_YEAR),
    link(ctx.href(rankingsPath('world')), ctx.text(RANKINGS_PAGE_META.world.title)),
    link(ctx.href(rankingsPath('race')), ctx.text(RANKINGS_PAGE_META.race.title)),
    link(ctx.href('/news'), ctx.text(NEWS_PAGE_META.title)),
    link(ctx.href('/about'), ctx.text(ABOUT_PAGE_META.title)),
  ]);

type Route = (ctx: Ctx, match: readonly string[], params: URLSearchParams) => PageView | null;

const ROUTES: readonly (readonly [RegExp, Route])[] = [
  [/^\/calendar$/, (ctx, _m, params) => calendarPage(ctx, Number(params.get('year')) || SEASON_YEAR)],
  [/^\/rankings$/, (ctx, _m, params) => rankingsPage(ctx, params.get('kind') === 'race' ? 'race' : 'world')],
  [/^\/news$/, (ctx) => newsPage(ctx)],
  [/^\/about$/, (ctx) => aboutPage(ctx)],
  [/^\/world-tour\/(\d{4})\/([^/]+)$/, (ctx, m) => tournamentPage(ctx, Number(m[1]), decodeURIComponent(m[2] ?? ''))],
  [/^\/players\/([^/]+)$/, (ctx, m) => playerPage(ctx, decodeURIComponent(m[1] ?? ''))],
  [/^\/news\/(\d+)$/, (ctx, m) => articlePage(ctx, m[1] ?? '')],
];

export const pageView = (ctx: Ctx, path: string, params: URLSearchParams) => {
  for (const [pattern, route] of ROUTES) {
    const match = pattern.exec(path);
    if (match) return route(ctx, match, params);
  }
  return null;
};
