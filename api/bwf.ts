import { bwfProxy } from '../server/bwf-proxy.ts';
import { vercelFunction } from '../server/endpoints.ts';

export default vercelFunction(bwfProxy({ relayUrl: process.env.BWF_RELAY_URL, relayKey: process.env.BWF_RELAY_KEY }));
