import { Trans, useLingui } from '@lingui/react/macro';
import { memo, useMemo, type FC } from 'react';

import { Duration, LiveDot, StatusChip } from '~/components/ui';
import { useLivePaused } from '~/hooks/useLivePaused';
import type { Match, Tournament } from '~/types';

import { ShowdownCard, toShowdownView, useMatchLiveView, type ShowdownView } from '../showdown';

import classes from './MatchDetail.module.css';

const LiveStatus: FC<{ view: ShowdownView }> = ({ view: v }) => {
  const paused = useLivePaused();
  const chip = v.live.status;
  return (
    <>
      <span className={classes.sbLive}>
        <LiveDot pulse={!paused} />
        <Trans context="match status" comment="Scoreboard status: the match is being played right now">
          Live
        </Trans>
      </span>
      {chip && <StatusChip tone={chip.tone}>{chip.label}</StatusChip>}
      {paused && (
        <StatusChip tone="silver">
          <Trans comment="Small chip on a live scoreboard when score updates are temporarily paused because the live feed is overloaded; the last score stays on screen">
            Updates paused
          </Trans>
        </StatusChip>
      )}
    </>
  );
};

const UPCOMING = (
  <span className={classes.sbState}>
    <Trans context="match status" comment="Scoreboard status: the match has not started yet">
      Upcoming
    </Trans>
  </span>
);

const FINAL = (
  <span className={classes.sbState}>
    <Trans
      context="match status"
      comment="Scoreboard status: the match is over. Avoid the word for the tournament’s final round, which would be confusing"
    >
      Finished
    </Trans>
  </span>
);

const HeadStatus: FC<{ view: ShowdownView; status: Match['status'] }> = ({ view, status }) => {
  if (status === 'P') return <LiveStatus view={view} />;
  return status === 'N' ? UPCOMING : FINAL;
};

export const Scoreboard = memo<{ match: Match; tournament: Tournament }>(({ match: m, tournament }) => {
  const [ref, live] = useMatchLiveView<HTMLElement>(tournament, m, false, true);
  const view = useMemo(() => toShowdownView(m, live), [m, live]);
  const { t } = useLingui();
  return (
    <ShowdownCard
      ref={ref}
      view={view}
      label={t({ message: 'Score', comment: 'Accessible name of the match scoreboard' })}
      follow
      totals={false}
    >
      <div className={classes.sbHead}>
        <span className={classes.sbStatus}>
          <HeadStatus view={view} status={m.status} />
        </span>
        {m.status !== 'N' && <Duration min={m.durationMin} className={classes.sbDuration} />}
      </div>
    </ShowdownCard>
  );
});
