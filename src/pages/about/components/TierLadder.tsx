import { msg } from '@lingui/core/macro';
import { Plural, Trans, useLingui } from '@lingui/react/macro';
import { Link } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { memo, useMemo, type CSSProperties, type FC } from 'react';

import { LevelBadge } from '~/components/tournament';
import { Tip } from '~/components/ui';
import { LEVEL_META, LEVEL_VARS, SUPER_100_POINTS } from '~/constants';
import type { Tournament } from '~/types';
import { formatNumber } from '~/utils/format';
import { tournamentParams } from '~/utils/tournaments';

import { PATHWAY_NOTE, PRIZE_TBC } from '../constants';
import type { TierSummary } from '../types';

import classes from './TierLadder.module.css';
import utils from '~/styles/utils.module.css';

const FILL_MIN = 28;
const FILL_RANGE = 150;

const CALENDAR_LINK = msg({
  message: '{count, plural, one {{name}: # event in the calendar} other {{name}: # events in the calendar}}',
  comment:
    'Screen-reader label for a tier card on the About page that opens the calendar filtered to that level; {name} is a tier such as “Super 1000”',
});

const EventChip = memo<{ tournament: Tournament }>(({ tournament: t }) => (
  <Tip label={t.title} disabled={t.title === t.name} tap={false}>
    <Link
      to="/world-tour/$year/$slug"
      params={tournamentParams(t)}
      className={classes.chip}
      data-done={t.status === 'done' || undefined}
    >
      {t.name}
    </Link>
  </Tip>
));

const TierUnit: FC<{ tier: TierSummary }> = ({ tier }) => {
  const count = tier.events.length;
  return tier.level === 'Finals' ? (
    <Trans comment="About page tier ladder: unit under the number 1 for the World Tour Finals, the single season-ending event">
      finale
    </Trans>
  ) : (
    <Plural
      value={count}
      one="event"
      other="events"
      comment="About page tier ladder: unit shown under the big number of tournaments at this level"
    />
  );
};

const WinnerPoints: FC<{ points: number }> = ({ points }) => {
  const value = formatNumber(points);
  return (
    <Trans comment="About page tier ladder: World Tour ranking points the champion of a tournament at this level earns">
      <b className={utils.num}>{value}</b> pts to the winner
    </Trans>
  );
};

const TierCard = memo<{ tier: TierSummary }>(({ tier }) => {
  const { i18n } = useLingui();
  const { level, share, events } = tier;
  const style = useMemo(
    () =>
      ({
        ...LEVEL_VARS[level],
        '--h': `${Math.round(FILL_MIN + share * FILL_RANGE)}px`,
        '--w': `${share * 100}%`,
      }) as CSSProperties,
    [level, share],
  );
  const search = useMemo(() => ({ levels: [level] }), [level]);
  const name = LEVEL_META[level].long;
  const count = events.length;
  const prize = tier.prize ?? i18n._(PRIZE_TBC);
  return (
    <article className={classes.tier} style={style}>
      <Link
        to="/calendar"
        search={search}
        className={utils.hit}
        aria-label={i18n._({ ...CALENDAR_LINK, values: { count, name } })}
      />
      <div className={classes.fill}>
        <span className={clsx(utils.num, classes.prize)}>{prize}</span>
      </div>
      <div className={classes.count}>
        <span className={clsx(utils.figure, classes.figure)}>{count}</span>
        <span>
          <TierUnit tier={tier} />
        </span>
      </div>
      <div className={classes.info}>
        <span className={classes.head}>
          <LevelBadge level={level} long={level === 'Finals'} size="sm" />
          <span className={clsx(utils.num, classes.mPrize)}>{prize}</span>
        </span>
        <span className={classes.track} />
        <span className={classes.meta}>
          <span>
            <WinnerPoints points={tier.points} />
          </span>
          <span>{i18n._(tier.draw)}</span>
        </span>
      </div>
      <div className={classes.chips}>
        {events.map((e) => (
          <EventChip key={e.code} tournament={e} />
        ))}
      </div>
    </article>
  );
});

const PathwayCard = memo(() => {
  const { i18n } = useLingui();
  return (
    <article className={clsx(classes.tier, classes.path)}>
      <div className={classes.fill} />
      <div className={classes.info}>
        <span className={classes.pathLabel}>Super 100</span>
        <span className={classes.note}>{i18n._(PATHWAY_NOTE)}</span>
        <span className={classes.meta}>
          <span>
            <WinnerPoints points={SUPER_100_POINTS} />
          </span>
        </span>
      </div>
    </article>
  );
});

export const TierLadder = memo<{ tiers: readonly TierSummary[]; pathway: boolean }>(({ tiers, pathway }) => (
  <div className={classes.ladder}>
    {tiers.map((t) => (
      <TierCard key={t.level} tier={t} />
    ))}
    {pathway && <PathwayCard />}
  </div>
));
