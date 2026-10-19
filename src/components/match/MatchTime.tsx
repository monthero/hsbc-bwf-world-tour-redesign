import { Trans, useLingui } from '@lingui/react/macro';
import { clsx } from 'clsx';
import { memo } from 'react';

import { Tip } from '~/components/ui';
import { useMatchTime } from '~/hooks/useMatchClock';
import type { Match, SideResult } from '~/types';
import { dayMark } from '~/utils/match-time';

import { TBD } from './labels';

import classes from './MatchTime.module.css';

export const MatchTime = memo<{
  match: Match;
  zone?: boolean;
  stacked?: boolean;
  fallback?: string;
  className?: string;
}>(({ match, zone = true, stacked = false, fallback = '', className }) => {
  const t = useMatchTime(match);
  if (!t) return fallback ? <span className={className}>{fallback}</span> : null;
  return (
    <Tip label={t.alt}>
      <span
        className={clsx(classes.time, className)}
        data-tip={t.alt ? true : undefined}
        data-stacked={stacked || undefined}
      >
        {t.text}
        {t.shift !== 0 && <span className={classes.shift}>{dayMark(t.shift)}</span>}
        {zone && t.zone && <span className={classes.zone}>{t.zone}</span>}
      </span>
    </Tip>
  );
});

export const TimedStatus = memo<{ match: Match | null | undefined; tone: SideResult; label: string }>(
  ({ match, tone, label }) => {
    const { i18n } = useLingui();
    return tone === 'up' && match ? (
      <>
        <MatchTime match={match} fallback={i18n._(TBD)} />
        {label && ` · ${label}`}
      </>
    ) : (
      label
    );
  },
);

export const ScheduledStart = memo<{ match: Match; className?: string; timeClassName?: string }>(
  ({ match, className, timeClassName }) => (
    <span className={className}>
      {match.time ? (
        <Trans comment="Scoreboard status for a scheduled match: it starts at this time or later, e.g. “Not before 14:30”">
          Not before <MatchTime match={match} className={timeClassName} />
        </Trans>
      ) : (
        <Trans>Time to be announced</Trans>
      )}
    </span>
  ),
);
