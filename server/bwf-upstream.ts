export const BWF_API = 'https://extranet-lv.bwfbadminton.com/api';

const BWF_SITE = 'https://bwfworldtour.bwfbadminton.com';

export const BWF_HEADERS = {
  'user-agent': 'Mozilla/5.0 (compatible; bwf-tracker-dev/0.1)',
  accept: 'application/json, text/plain, */*',
  'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
  origin: BWF_SITE,
  referer: `${BWF_SITE}/`,
};

export const BWF_PATHS = [
  '/tournaments/day-matches',
  '/match-center/vue-match-stat',
  '/vue-tournament-draws',
  '/vue-tournament-draw-data',
  '/entries/vue-tournament-events',
  '/entries/vue-tournament-players',
] as const;

export type BwfPath = (typeof BWF_PATHS)[number];

export const isBwfPath = (path: string): path is BwfPath => (BWF_PATHS as readonly string[]).includes(path);

export const RELAY_KEY_HEADER = 'x-relay-key';
