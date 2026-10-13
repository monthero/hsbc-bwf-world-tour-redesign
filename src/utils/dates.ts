import dayjs, { type Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';

import type { Match } from '~/types';

dayjs.extend(utc);

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

export const formatDateRange = (start: Dayjs, end: Dayjs, { long = false, pad = true } = {}) => {
  const day = pad ? 'DD' : 'D';
  const dm = `${day} ${long ? 'MMMM' : 'MMM'}`;
  return start.month() === end.month()
    ? `${start.format(day)}–${end.format(dm)}`
    : `${start.format(dm)} – ${end.format(dm)}`;
};

export const formatDayMonth = (iso: string) => date(iso).format('D MMM');

export const formatDayMonthYear = (iso: string) => date(iso).format('D MMM YYYY');

export const monthKeyOf = (iso: string) => date(iso).format('YYYY-MM');

export const monthOf = (key: string) => date(`${key}-01`);

export const formatMonth = (key: string) => monthOf(key).format('MMMM YYYY');

export const formatLocalDayTime = (iso: string) => dayjs(iso).format('ddd D MMM, HH:mm');

export const hoursSince = (iso: string) => dayjs.utc().diff(date(iso), 'hour', true);

export const ageOn = (born: string, at: Dayjs = today()) => at.diff(date(born), 'year');

export const matchMoment = (m: Pick<Match, 'date' | 'time'>) => dayjs.utc(`${m.date}T${m.time || '00:00'}`);

export const hourOf = (m: Pick<Match, 'date' | 'time'>) => matchMoment(m).format('HH:00');
