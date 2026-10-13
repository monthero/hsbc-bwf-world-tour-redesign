import { bwfProxy } from '../server/bwf-proxy.ts';
import { vercelFunction } from '../server/endpoints.ts';

export default vercelFunction(bwfProxy);
