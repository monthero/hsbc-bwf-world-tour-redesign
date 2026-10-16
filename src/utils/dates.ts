import dayjs, { type Dayjs } from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

import { dateFormat } from '~/i18n/current';

dayjs.extend(utc);
dayjs.extend(timezone);

export { dayjs, type Dayjs };

export const date = (iso: string) => dayjs.utc(iso);

export const ISO_DAY = 'YYYY-MM-DD';

const PINNED_DATE = import.meta.env.VITE_SNAPSHOT_DATE;

export const todayIso = () => PINNED_DATE || dayjs().format(ISO_DAY);

export const today = () => date(todayIso());

export const isoRange = (start: string, end: string) => {
  const out: string[] = [];
  for (let d = date(start), e = date(end); !d.isAfter(e); d = d.add(1, 'day')) out.push(d.format(ISO_DAY));
  return out;
};

const MINUTE_MS = 60_000;

const wallDate = (d: Dayjs) => new Date(d.valueOf() + d.utcOffset() * MINUTE_MS);

export const formatWall = (d: Dayjs, options: Intl.DateTimeFormatOptions) => dateFormat(options).format(wallDate(d));

export const formatDateRange = (start: Dayjs, end: Dayjs, { long = false, pad = true, year = false } = {}) =>
  dateFormat({
    day: pad ? '2-digit' : 'numeric',
    month: long ? 'long' : 'short',
    ...(year && { year: 'numeric' }),
  }).formatRange(wallDate(start), wallDate(end));

const DAY_MONTH = { day: 'numeric', month: 'short' } as const;
const DAY_MONTH_YEAR = { day: 'numeric', month: 'short', year: 'numeric' } as const;
const MONTH_YEAR = { month: 'short', year: 'numeric' } as const;
const LONG_MONTH_YEAR = { month: 'long', year: 'numeric' } as const;

export const formatDayMonth = (iso: string) => formatWall(date(iso), DAY_MONTH);

export const formatDayMonthYear = (iso: string) => formatWall(date(iso), DAY_MONTH_YEAR);

export const formatMonthYear = (iso: string) => formatWall(date(iso), MONTH_YEAR);

export const monthKeyOf = (iso: string) => date(iso).format('YYYY-MM');

export const monthOf = (key: string) => date(`${key}-01`);

export const formatMonth = (key: string) => formatWall(monthOf(key), LONG_MONTH_YEAR);

export const hoursSince = (iso: string) => dayjs.utc().diff(date(iso), 'hour', true);

export const ageOn = (born: string, at: Dayjs = today()) => at.diff(date(born), 'year');
