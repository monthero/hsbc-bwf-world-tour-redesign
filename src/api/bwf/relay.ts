export const BWF_RELAY_URL = 'https://bwf-relay.monthero-dev.workers.dev';

export const RELAY_FETCH_PATH = '/fetch';

export const RELAY_TOKEN_HEADER = 'x-relay-token';

const RELAY_HOSTS = /(^|\.)bwfbadminton\.com$/;

export const isRelayHost = (url: URL) => url.protocol === 'https:' && RELAY_HOSTS.test(url.hostname);
