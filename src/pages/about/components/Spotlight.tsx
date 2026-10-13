import { Skeleton } from '@mantine/core';
import { useMemo, type FC } from 'react';

import { FinaleCard, TournamentCard } from '~/components/tournament';
import { SEASON_YEAR } from '~/constants';
import { useIsMobile } from '~/hooks/useIsMobile';
import { useSeasonEdge, useTournaments } from '~/hooks/useTournaments';
import { summarize } from '~/utils/season';

import { KICKERS, NEXT_SEASON, SPOTLIGHT, TITLES_HEADING, TITLES_TOP_N, UP_NEXT } from '../constants';
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

const cardKicker = (live: boolean, upcoming: boolean) => {
  if (live) return KICKERS.live;
  return upcoming ? UP_NEXT : NEXT_SEASON;
};

export const Spotlight: FC = () => {
  const { data } = useTournaments(SEASON_YEAR);
  const isMobile = useIsMobile();
  const season = useMemo(() => (data ? summarize(data, SEASON_YEAR) : undefined), [data]);
  const titles = useMemo(() => (data ? titlesSummary(data, TITLES_TOP_N) : undefined), [data]);
  const opener = useSeasonEdge(SEASON_YEAR + 1, !!season && !season.target)?.[0];
  if (!season) return LOADING;
  const { target, live, finals } = season;
  const card = target ?? opener;
  const showCard = !isMobile && !!card && card !== finals;
  const showTitles = !isMobile && !!titles?.titles;
  const heading = season.done === season.total ? TITLES_HEADING.complete : TITLES_HEADING.running;
  return (
    <div className={classes.grid}>
      {showCard && <TournamentCard tournament={card} isNext={!live} link kicker={cardKicker(!!live, !!target)} />}
      {finals && <FinaleCard tournament={finals} compact className={classes.finale} />}
      {showTitles && <TitlesSoFar summary={titles} heading={heading} />}
    </div>
  );
};
