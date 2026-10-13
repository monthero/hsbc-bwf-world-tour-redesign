import { EventCode } from '../schemas';
import { bwfGet } from './http';
import { toDrawMatches, toEntryDto, toLiveServers, toMatchDto, toMatchStats, type NameOf } from './normalize';
import { BwfDayMatches, BwfDrawData, BwfDraws, BwfEntries, BwfLiveMatches, BwfMatchStat, BwfOptions } from './schemas';

const MAIN_DRAW = 0;

export const fetchDayMatches = async (code: string, day: string, names: NameOf, signal?: AbortSignal) => {
  const raw = await bwfGet(
    'tournaments/day-matches',
    { tournamentCode: code, date: day, order: 2, court: 0 },
    BwfDayMatches,
    signal,
  );
  return raw.flatMap((m) => toMatchDto(m, names) ?? []);
};

export const fetchMatchStats = async (tmtId: number, matchCode: string, signal?: AbortSignal) =>
  toMatchStats(await bwfGet('match-center/vue-match-stat', { tmtId, matchId: matchCode }, BwfMatchStat, signal));

export const fetchLiveServers = async (tmtId: number, signal?: AbortSignal) =>
  toLiveServers(await bwfGet('match-center/vue-live-matches', { tmtId }, BwfLiveMatches, signal));

export const fetchDraw = async (tmtId: number, names: NameOf, signal?: AbortSignal) => {
  const { results } = await bwfGet('vue-tournament-draws', { tmtTab: 'draw', tmtId }, BwfDraws, signal);
  const main = (results ?? []).filter((d) => d.type === MAIN_DRAW);
  const data = await Promise.all(
    main.map((d) =>
      bwfGet(
        'vue-tournament-draw-data',
        { tmtTab: 'draw', tmtId, drawId: d.value, isPara: 'false' },
        BwfDrawData,
        signal,
      ),
    ),
  );
  return data.flatMap((d) => toDrawMatches(d, names));
};

const fetchEventEntries = async (
  tmtId: number,
  value: string,
  event: EventCode,
  names: NameOf,
  signal?: AbortSignal,
) => {
  const { results } = await bwfGet(
    'entries/vue-tournament-players',
    { searchKey: '', tmtId, tmtType: 0, eventName: value, isPara: 0 },
    BwfEntries,
    signal,
  );
  return (results ?? []).flatMap((e) => toEntryDto(event, e, names) ?? []);
};

export const fetchEntries = async (tmtId: number, names: NameOf, signal?: AbortSignal) => {
  const { results } = await bwfGet('entries/vue-tournament-events', { tmtId }, BwfOptions, signal);
  const lists = await Promise.all(
    (results ?? []).map((o) => {
      const event = EventCode.safeParse(o.text);
      return event.success ? fetchEventEntries(tmtId, o.value, event.data, names, signal) : Promise.resolve([]);
    }),
  );
  return lists.flat();
};
