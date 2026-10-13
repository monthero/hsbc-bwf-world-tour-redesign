import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';

dayjs.extend(utc);

const DAY_MIN = 1440;
const WEST_MIN = -600;
const STEP_MIN = 15;

export const wallClock = (iso: string | null | undefined) => iso?.slice(11, 16) ?? '';

export const utcOffsetOf = (day: string, time: string, utcIso: string | null | undefined): number | null => {
  if (!day || !time || !utcIso) return null;
  const local = dayjs.utc(`${day}T${time}`);
  const start = dayjs.utc(utcIso.slice(0, 19).replace(' ', 'T'));
  if (!local.isValid() || !start.isValid()) return null;
  const diff = local.diff(start, 'minute');
  const wrapped = ((((diff - WEST_MIN) % DAY_MIN) + DAY_MIN) % DAY_MIN) + WEST_MIN;
  return wrapped % STEP_MIN === 0 ? wrapped : null;
};

export const dominantOffset = (offsets: Iterable<number | null>): number | null => {
  const counts = new Map<number, number>();
  for (const o of offsets) if (o !== null) counts.set(o, (counts.get(o) ?? 0) + 1);
  let best: number | null = null;
  let most = 0;
  for (const [o, n] of counts)
    if (n > most) {
      best = o;
      most = n;
    }
  return best;
};
