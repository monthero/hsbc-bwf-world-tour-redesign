import { bwfReply } from './bwf-upstream.ts';
import type { Endpoint } from './endpoints.ts';
import { sendJson } from './http.ts';

export const bwfProxy: Endpoint = {
  name: 'bwf-api',
  prefix: '/bwf-api',
  serve: async (url, res) => {
    const { status, body, cache } = await bwfReply(url);
    sendJson(res, status, body, cache);
  },
};
