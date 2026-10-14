import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';

dayjs.extend(utc);

export { dayjs };

export const ISO_DAY = 'YYYY-MM-DD';

export const MINUTE_MS = 60_000;
export const HOUR_MS = 60 * MINUTE_MS;
export const DAY_MS = 24 * HOUR_MS;

export const utcDay = (iso: string) => dayjs.utc(iso);

export const todayIso = () => dayjs.utc().format(ISO_DAY);

export const nowIso = () => dayjs().toISOString();

export const addDays = (iso: string, n: number) => utcDay(iso).add(n, 'day').format(ISO_DAY);

export const isoRange = (from: string, to: string) => {
  const out: string[] = [];
  for (let d = utcDay(from), end = utcDay(to); !d.isAfter(end); d = d.add(1, 'day')) out.push(d.format(ISO_DAY));
  return out;
};
