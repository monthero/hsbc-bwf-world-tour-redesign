import dayjs, { type Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc.js';

dayjs.extend(utc);

export { dayjs, type Dayjs };

export const ISO_DAY = 'YYYY-MM-DD';

export const utcDay = (iso: string) => dayjs.utc(iso);

export const todayIso = () => dayjs.utc().format(ISO_DAY);

export const nowIso = () => dayjs().toISOString();

export const addDays = (iso: string, n: number) => utcDay(iso).add(n, 'day').format(ISO_DAY);

export const isoRange = (from: string, to: string) => {
  const out: string[] = [];
  for (let d = utcDay(from), end = utcDay(to); !d.isAfter(end); d = d.add(1, 'day')) out.push(d.format(ISO_DAY));
  return out;
};
