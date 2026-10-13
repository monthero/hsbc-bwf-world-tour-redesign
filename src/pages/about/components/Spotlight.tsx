import { Skeleton } from '@mantine/core';
import { useMemo, type FC } from 'react';

import { FinaleCard, TournamentCard } from '~/components/tournament';
import { SEASON_YEAR } from '~/constants';
import { useIsMobile } from '~/hooks/useIsMobile';
import { useTournaments } from '~/hooks/useTournaments';
import { summarize } from '~/utils/season';

import { KICKERS, SPOTLIGHT, TITLES_TOP_N, UP_NEXT } from '../constants';
import { titlesSummary } from '../summaries';
import { TitlesSoFar } from './TitlesSoFar';

import classes from './Spotlight.module.css';

const LOADING = (
  <div className={classes.grid}>
    {SPOTLIGHT.map((id) => (
      <Skeleton key={id} className={classes.skeleton} data-id={id} radius={16} />
    ))}
  </div>
);

export const Spotlight: FC = () => {
  const { data } = useTournaments(SEASON_YEAR);
  const isMobile = useIsMobile();
  const season = useMemo(() => (data ? summarize(data, SEASON_YEAR) : undefined), [data]);
  const titles = useMemo(() => (data ? titlesSummary(data, TITLES_TOP_N) : undefined), [data]);
  if (!season) return LOADING;
  const { target, live, finals } = season;
  const showTarget = !isMobile && !!target && target !== finals;
  const showTitles = !isMobile && !!titles?.titles;
  return (
    <div className={classes.grid}>
      {showTarget && <TournamentCard tournament={target} isNext={!live} link kicker={live ? KICKERS.live : UP_NEXT} />}
      {finals && <FinaleCard tournament={finals} compact className={classes.finale} />}
      {showTitles && <TitlesSoFar summary={titles} />}
    </div>
  );
};
