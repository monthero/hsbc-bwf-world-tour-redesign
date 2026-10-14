import { Tooltip } from '@mantine/core';
import { clsx } from 'clsx';
import { memo, type FC } from 'react';

import { EventTag } from '~/components/match';
import { IconCheck } from '~/components/ui';
import { EVENT_NAMES, NOT_QUALIFY_TIP } from '~/constants';
import { useFinalsCity } from '~/hooks/useTournaments';
import type { RankView } from '~/types';
import { changeDir, formatChange, formatRank } from '~/utils/format';
import { qualifyTip } from '~/utils/tournaments';

import { Partner } from './Partner';

import classes from './Rank.module.css';

export const RankChange: FC<{ value: number; variant?: 'text' | 'pill'; className?: string }> = ({
  value,
  variant = 'text',
  className,
}) => {
  if (!value) return null;
  return (
    <span className={clsx(classes.change, className)} data-dir={changeDir(value)} data-variant={variant}>
      {formatChange(value)}
    </span>
  );
};

export const RankValue: FC<{ value: number | null | undefined; className?: string }> = ({ value, className }) => {
  return (
    <span className={className}>
      {value ? (
        <>
          <span className={classes.hash}>#</span>
          {value}
        </>
      ) : (
        '—'
      )}
    </span>
  );
};

const QualifiedBadge: FC = () => {
  const city = useFinalsCity();
  return (
    <Tooltip label={qualifyTip(city)}>
      <span className={classes.q}>
        <IconCheck size={12} />Q
      </span>
    </Tooltip>
  );
};

export const QualifyMark: FC<{ qualified?: boolean; blocked?: boolean }> = ({ qualified, blocked }) => {
  if (qualified) return <QualifiedBadge />;
  if (blocked)
    return (
      <Tooltip label={NOT_QUALIFY_TIP}>
        <span className={classes.qOut}>Q</span>
      </Tooltip>
    );
  return null;
};

export const RaceQualifier: FC<{ rank: RankView }> = ({ rank: k }) => (
  <QualifyMark qualified={k.race?.qualified} blocked={k.race?.blocked} />
);

export const RankCard = memo<{ rank: RankView }>(({ rank: k }) => (
  <div className={classes.card}>
    <span className={classes.head}>
      <EventTag event={k.ev} />
      <span className={classes.evName}>{EVENT_NAMES[k.ev]}</span>
    </span>
    <div className={classes.split}>
      <div className={classes.cCol}>
        <span className={classes.cKey}>Current</span>
        <span className={classes.cLine}>
          <span className={classes.cNum}>{formatRank(k.rank)}</span>
          <RankChange value={k.change} />
        </span>
        {!k.rank && <span className={classes.cWith}>Not ranked this week</span>}
        {k.partner && <Partner player={k.partner} className={classes.cWith} />}
      </div>
      <div className={classes.cCol}>
        <span className={classes.cKey}>Career high</span>
        <span className={clsx(classes.cNum, classes.gold)}>{formatRank(k.highest)}</span>
        {k.highestPartner && <Partner player={k.highestPartner} className={classes.cWith} />}
      </div>
    </div>
  </div>
));
