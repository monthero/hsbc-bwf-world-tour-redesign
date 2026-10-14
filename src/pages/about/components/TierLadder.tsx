import { Link } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { memo, useMemo, type CSSProperties } from 'react';

import { LevelBadge } from '~/components/tournament';
import { LazyTip, useLazyTip } from '~/components/ui';
import { LEVEL_META, LEVEL_VARS, SUPER_100_POINTS } from '~/constants';
import type { Tournament } from '~/types';
import { formatNumber, plural } from '~/utils/format';
import { tournamentParams } from '~/utils/tournaments';

import { PATHWAY_NOTE } from '../constants';
import type { TierSummary } from '../types';

import classes from './TierLadder.module.css';
import utils from '~/styles/utils.module.css';

const FILL_MIN = 28;
const FILL_RANGE = 150;

const EventChip = memo<{ tournament: Tournament }>(({ tournament: t }) => {
  const lazy = useLazyTip<HTMLAnchorElement>(t.title !== t.name);
  return (
    <>
      <Link
        to="/world-tour/$year/$slug"
        params={tournamentParams(t)}
        className={classes.chip}
        data-done={t.status === 'done' || undefined}
        onPointerEnter={lazy.arm}
      >
        {t.name}
      </Link>
      <LazyTip target={lazy.target} label={t.title} />
    </>
  );
});

const unitOf = (t: TierSummary) => {
  if (t.level === 'Finals') return 'finale';
  return t.events.length === 1 ? 'event' : 'events';
};

const TierCard = memo<{ tier: TierSummary }>(({ tier: t }) => {
  const style = useMemo(
    () =>
      ({
        ...LEVEL_VARS[t.level],
        '--h': `${Math.round(FILL_MIN + t.share * FILL_RANGE)}px`,
        '--w': `${t.share * 100}%`,
      }) as CSSProperties,
    [t.level, t.share],
  );
  const search = useMemo(() => ({ levels: [t.level] }), [t.level]);
  return (
    <article className={classes.tier} style={style}>
      <Link
        to="/calendar"
        search={search}
        className={utils.hit}
        aria-label={`${LEVEL_META[t.level].long}: ${plural(t.events.length, 'event')} in the calendar`}
      />
      <div className={classes.fill}>
        <span className={clsx(utils.num, classes.prize)}>{t.prize}</span>
      </div>
      <div className={classes.count}>
        <span className={clsx(utils.figure, classes.figure)}>{t.events.length}</span>
        <span>{unitOf(t)}</span>
      </div>
      <div className={classes.info}>
        <span className={classes.head}>
          <LevelBadge level={t.level} long={t.level === 'Finals'} size="sm" />
          <span className={clsx(utils.num, classes.mPrize)}>{t.prize}</span>
        </span>
        <span className={classes.track} />
        <span className={classes.meta}>
          <span>
            <b className={utils.num}>{formatNumber(t.points)}</b> pts to the winner
          </span>
          <span>{t.draw}</span>
        </span>
      </div>
      <div className={classes.chips}>
        {t.events.map((e) => (
          <EventChip key={e.code} tournament={e} />
        ))}
      </div>
    </article>
  );
});

const PathwayCard = memo(() => (
  <article className={clsx(classes.tier, classes.path)}>
    <div className={classes.fill} />
    <div className={classes.info}>
      <span className={classes.pathLabel}>Super 100</span>
      <span className={classes.note}>{PATHWAY_NOTE}</span>
      <span className={classes.meta}>
        <span>
          <b className={utils.num}>{formatNumber(SUPER_100_POINTS)}</b> pts to the winner
        </span>
      </span>
    </div>
  </article>
));

export const TierLadder = memo<{ tiers: readonly TierSummary[]; pathway: boolean }>(({ tiers, pathway }) => (
  <div className={classes.ladder}>
    {tiers.map((t) => (
      <TierCard key={t.level} tier={t} />
    ))}
    {pathway && <PathwayCard />}
  </div>
));
