import { byNewest, monthCounts, NEWS_LATEST, newsMonthOf, newsOfTournament } from '../../server/news.ts';
import type { NewsIndex, NewsItem, NewsMonth, NewsTournament } from '../../src/api/schemas.ts';
import { nowIso } from './dates.ts';
import { all, type Db } from './db.ts';
import type { Output } from './output.ts';

export const exportNews = (db: Db, output: Output) => {
  const write = (rel: string, data: NewsIndex | NewsMonth | NewsTournament) =>
    output.write(`news/${rel}`, JSON.stringify(data));

  const items = all<{ item: string }>(db, 'SELECT item FROM news')
    .map((r) => JSON.parse(r.item) as NewsItem)
    .sort(byNewest);
  const bySlug = new Map(items.map((i) => [i.slug, i]));
  const popular = all<{ slug: string }>(db, 'SELECT slug FROM news_popular ORDER BY rank')
    .map((r) => bySlug.get(r.slug))
    .filter((i) => i !== undefined);

  const months = monthCounts(items);
  for (const { month } of months)
    write(`${month}.json`, { month, items: items.filter((i) => newsMonthOf(i) === month) });
  write('index.json', { asOf: nowIso(), latest: items.slice(0, NEWS_LATEST), popular, months });

  const tournaments = all<{ code: string }>(db, 'SELECT code FROM editions').map(({ code }) => ({
    code,
    items: newsOfTournament(items, code),
  }));
  for (const t of tournaments) write(`tournaments/${t.code}.json`, t);
  const covered = tournaments.filter((t) => t.items.length).length;

  let articleBytes = 0;
  const articles = all<{ id: number; article: string }>(db, 'SELECT id, article FROM news_articles');
  for (const a of articles) {
    output.write(`news/articles/${a.id}.json`, a.article);
    articleBytes += a.article.length;
  }

  console.log(
    `export news: ${items.length} articles · ${months.length} months · ${popular.length} popular · ${covered}/${tournaments.length} tournaments · ${articles.length} articles (${(articleBytes / 1e6).toFixed(1)} MB)`,
  );
};
