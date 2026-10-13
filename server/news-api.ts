import type { ServerResponse } from 'node:http';

import type { Endpoint } from './endpoints.ts';
import { IMMUTABLE_CACHE, sendJson } from './http.ts';
import { createNewsService, isNewsMonth, isSettledNewsMonth } from './news.ts';

const RECENT_CACHE = 'public, max-age=600';
const MONTH_URL = /^\/month\/(\d{4}-\d{2})$/;
const TOURNAMENT_URL = /^\/tournament\/([\w-]+)$/;
const ARTICLE_URL = /^\/article\/(\d+)$/;

export const newsEndpoint = (root: string): Endpoint => {
  const service = createNewsService(root);
  const serve = async (url: string, res: ServerResponse) => {
    if (url === '/index') return sendJson(res, 200, await service.index(), RECENT_CACHE);
    const id = ARTICLE_URL.exec(url)?.[1];
    if (id) {
      const hit = await service.article(id);
      if (!hit) return sendJson(res, 404, { error: 'Unknown article' });
      return sendJson(res, 200, hit.article, hit.settled ? IMMUTABLE_CACHE : 'no-cache');
    }
    const code = TOURNAMENT_URL.exec(url)?.[1];
    if (code) {
      const hit = await service.tournament(code);
      if (!hit) return sendJson(res, 404, { error: 'Unknown tournament' });
      return sendJson(res, 200, hit.news, hit.settled ? IMMUTABLE_CACHE : RECENT_CACHE);
    }
    const month = MONTH_URL.exec(url)?.[1];
    if (!month || !isNewsMonth(month)) return sendJson(res, 404, { error: 'Unknown news route' });
    return sendJson(res, 200, await service.month(month), isSettledNewsMonth(month) ? IMMUTABLE_CACHE : RECENT_CACHE);
  };
  return { name: 'news-api', prefix: '/news-api', serve: (url, res) => serve(url.pathname, res) };
};
