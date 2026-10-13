import type { IncomingMessage } from 'node:http';

import { cdnCache, IMMUTABLE_CACHE } from './cache-control.ts';
import type { Endpoint } from './endpoints.ts';
import { sendJson } from './http.ts';
import { createMediaService, mediaPhase, type MediaPhase, type MediaServiceOptions } from './youtube.ts';

const MEDIA_URL = /^\/media\/([\dA-F-]{36})$/i;
const GEO_PATH = '/geo';
const MISS_CACHE = cdnCache(300, 0);
const FRESH_PARAM = 'fresh';
const PHASE_CACHE: Record<MediaPhase, string> = {
  upcoming: cdnCache(600, 600, 600),
  live: cdnCache(300, 60),
  settled: IMMUTABLE_CACHE,
};
const GEO_CACHE = 'private, max-age=3600';
const COUNTRY_HEADER = 'x-vercel-ip-country';
const COUNTRY = /^[A-Z]{2}$/;

const viewerCountry = (req: IncomingMessage) => {
  const value = req.headers[COUNTRY_HEADER];
  const country = (Array.isArray(value) ? value[0] : value)?.toUpperCase() ?? '';
  return COUNTRY.test(country) ? country : null;
};

export const youtubeEndpoint = ({ key, ...options }: Omit<MediaServiceOptions, 'key'> & { key?: string }): Endpoint => {
  const service = key ? createMediaService({ key, ...options }) : null;
  return {
    name: 'youtube-media',
    prefix: '/yt-api',
    serve: async (url, res, req) => {
      if (url.pathname === GEO_PATH) return sendJson(res, 200, { country: viewerCountry(req) }, GEO_CACHE);
      if (!service) return sendJson(res, 503, { error: 'YouTube media is not configured' });
      const code = MEDIA_URL.exec(url.pathname)?.[1];
      const event = code ? await service.eventOf(code) : null;
      if (!event) return sendJson(res, 404, { error: 'Unknown tournament' }, MISS_CACHE);
      const media = await service.media(event, url.searchParams.has(FRESH_PARAM));
      return sendJson(res, 200, media, PHASE_CACHE[mediaPhase(event)]);
    },
  };
};
