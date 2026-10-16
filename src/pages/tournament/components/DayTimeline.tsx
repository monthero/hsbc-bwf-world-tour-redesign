import { Trans, useLingui } from '@lingui/react/macro';
import { memo, useMemo, type FC } from 'react';

import { IconCheck, IconTimer, LiveDot, Tip } from '~/components/ui';
import type { Tournament, TournamentSchedule } from '~/types';
import { countdownLabel } from '~/utils/tournaments';

import { EXPECTED_ROUND_TIP } from '../constants';
import { buildTimeline, type TimelineDay } from '../utils';
import { RestBreak } from './RestBreak';

import classes from './DayTimeline.module.css';

const StatusLabel: FC<{ tournament: Tournament; today: TimelineDay | undefined }> = ({ tournament, today }) => {
  if (tournament.status === 'done')
    return (
      <>
        <IconCheck size={14} />
        <Trans comment="Tournament header status: the tournament has finished">Completed</Trans>
      </>
    );
  if (tournament.status === 'up')
    return (
      <>
        <IconTimer size={14} />
        {countdownLabel(tournament, 'in')}
      </>
    );
  const { dayNumber, totalDays } = tournament;
  return (
    <>
      <LiveDot pulse size={7} />
      <span>
        <span className={classes.strong}>
          <Trans comment="Tournament header status while it is being played, e.g. “Day 3 of 6”">
            Day {dayNumber} of {totalDays}
          </Trans>
        </span>
        {today?.long && <span className={classes.phone}> · {today.long}</span>}
      </span>
    </>
  );
};

const repeatedKeys = (days: TimelineDay[]) => {
  const keys = new Set<string>();
  let prev = '';
  for (const d of days) {
    if (d.rest) continue;
    if (d.long && d.long === prev) keys.add(d.key);
    prev = d.long;
  }
  return keys;
};

const DayRound = memo<{ d: TimelineDay }>(({ d }) => {
  const { i18n } = useLingui();
  const el = (
    <b className={classes.round}>
      <span className={classes.long}>{d.long}</span>
      <span className={classes.short}>{d.short}</span>
    </b>
  );
  return d.expected ? <Tip label={i18n._(EXPECTED_ROUND_TIP)}>{el}</Tip> : el;
});

const DayItem = memo<{ d: TimelineDay; repeat: boolean }>(({ d, repeat }) =>
  d.rest ? (
    <li className={classes.rest}>
      <RestBreak label={d.rest} active={d.state === 'now'} />
    </li>
  ) : (
    <li
      className={classes.day}
      data-state={d.state}
      data-repeat={repeat || undefined}
      data-expected={d.expected || undefined}
    >
      <i className={classes.bar} />
      <small className={classes.date}>
        <span className={classes.dateFull}>{d.label}</span>
        <span className={classes.dateNum}>{d.num}</span>
      </small>
      <DayRound d={d} />
    </li>
  ),
);

export const DayTimeline = memo<{ tournament: Tournament; schedule: TournamentSchedule }>(
  ({ tournament: t, schedule }) => {
    const days = useMemo(() => buildTimeline(t, schedule), [t, schedule]);
    const repeats = useMemo(() => repeatedKeys(days), [days]);
    const today = days.find((d) => d.state === 'now');
    return (
      <div className={classes.timeline}>
        <div className={classes.head} data-status={t.status}>
          <StatusLabel tournament={t} today={today} />
        </div>
        <ol className={classes.days} dir="ltr">
          {days.map((d) => (
            <DayItem key={d.key} d={d} repeat={repeats.has(d.key)} />
          ))}
        </ol>
      </div>
    );
  },
);
