import { BWF_RELAY_URL, isRelayHost, RELAY_FETCH_PATH, RELAY_TOKEN_HEADER } from '../src/api/bwf/relay.ts';

const relayed = (url: URL, init: RequestInit, token: string) => {
  const headers = new Headers(init.headers);
  headers.set(RELAY_TOKEN_HEADER, token);
  const target = new URL(RELAY_FETCH_PATH, BWF_RELAY_URL);
  target.searchParams.set('url', url.href);
  return fetch(target, { ...init, headers });
};

export const relayFetch = (input: string | URL, init: RequestInit = {}) => {
  const url = new URL(input);
  const token = process.env.SYNC_RELAY_TOKEN;
  return token && isRelayHost(url) ? relayed(url, init, token) : fetch(url, init);
};
