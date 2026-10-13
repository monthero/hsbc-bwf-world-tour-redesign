import type { DatabaseSync } from 'node:sqlite';

import { ISO_DAY, utcDay } from '../scripts/sync/dates.ts';
import type { NewsArticle, NewsBlock, NewsRun } from '../src/api/schemas.ts';
import type { RetirementNews } from '../src/pages/admin/schema.ts';

const RETIRE = /retir|farewell/i;

const HITS_SQL = `
SELECT n.id, n.published_at AS date, a.article
FROM news n JOIN news_articles a ON a.id = n.id
WHERE a.article LIKE '%retir%' OR a.article LIKE '%farewell%'
`;

const LINKS_SQL = `
WITH hits AS (${HITS_SQL})
SELECT np.player_id AS player, np.news_id AS id FROM news_players np JOIN hits h ON h.id = np.news_id
UNION
SELECT j.value, h.id FROM hits h, json_each(h.article, '$.matchedPlayers') j
`;

interface HitRow {
  id: number;
  date: string;
  article: string;
}

interface LinkRow {
  player: string;
  id: number;
}

const runsOf = (b: NewsBlock): NewsRun[] => {
  if (b.type === 'list') return b.items.flat();
  return 'runs' in b ? b.runs : [];
};

const bodyOf = (a: NewsArticle) =>
  a.blocks
    .flatMap(runsOf)
    .map((r) => r.text)
    .join(' ');

const byRelevance = (a: RetirementNews, b: RetirementNews) =>
  Number(b.inTitle) - Number(a.inTitle) || b.date.localeCompare(a.date);

export const retirementNews = (db: DatabaseSync) => {
  const articles = new Map<number, RetirementNews>();
  for (const row of db.prepare(HITS_SQL).all() as unknown as HitRow[]) {
    const a = JSON.parse(row.article) as NewsArticle;
    const inTitle = RETIRE.test(a.title);
    if (inTitle || RETIRE.test(bodyOf(a)))
      articles.set(row.id, { id: String(row.id), title: a.title, date: utcDay(row.date).format(ISO_DAY), inTitle });
  }
  const byPlayer = new Map<string, RetirementNews[]>();
  for (const { player, id } of db.prepare(LINKS_SQL).all() as unknown as LinkRow[]) {
    const hit = articles.get(id);
    if (hit) byPlayer.set(player, [...(byPlayer.get(player) ?? []), hit]);
  }
  for (const list of byPlayer.values()) list.sort(byRelevance);
  return byPlayer;
};
