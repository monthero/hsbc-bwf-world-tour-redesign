import { useLingui } from '@lingui/react/macro';
import { useMemo, type FC } from 'react';

import { MatchVideos } from '~/components/media';
import { IconButton, IconClose } from '~/components/ui';
import { EVENT_NAMES } from '~/constants';
import type { Match, Tournament } from '~/types';
import { allGames, roundName } from '~/utils/matches';

import { MatchTime } from '../MatchTime';
import { MedalMark } from '../MedalMark';
import { HeadToHead } from './HeadToHead';
import { Scoreboard } from './Scoreboard';
import { StatsPanel } from './StatsPanel';
import { metaLead } from './utils';

import classes from './MatchDetail.module.css';

export const MatchDetail: FC<{
  match: Match;
  tournament: Tournament;
  onClose: () => void;
}> = ({ match, tournament, onClose }) => {
  const games = useMemo(() => allGames(match), [match]);
  const live = match.status === 'P' && match.current ? match.games.length : -1;
  const lead = metaLead(match);
  const time = match.status !== 'N' && match.time;
  const { t } = useLingui();
  return (
    <div className={classes.root}>
      <header className={classes.header}>
        <div className={classes.titles}>
          <span className={classes.tour}>{tournament.shortTitle}</span>
          <span className={classes.event}>{EVENT_NAMES[match.event]}</span>
          <span className={classes.meta}>
            {lead}
            {time && (
              <>
                {lead && ' · '}
                <MatchTime match={match} />
              </>
            )}
            {(lead || time) && ' · '}
            {roundName(match.round)}
            {match.status !== 'F' && <MedalMark round={match.round} className={classes.medal} />}
          </span>
        </div>
        <IconButton
          label={t({ message: 'Close', comment: 'Button that closes the match detail panel' })}
          onClick={onClose}
        >
          <IconClose size={15} />
        </IconButton>
      </header>
      <Scoreboard match={match} tournament={tournament} />
      {games.length > 0 && (
        <StatsPanel
          games={games}
          teams={match.teams}
          live={live}
          tmtId={tournament.tmtId ?? 0}
          code={match.code ?? ''}
          className={classes.section}
        />
      )}
      <MatchVideos match={match} tournament={tournament} className={classes.section} />
      <HeadToHead match={match} tournament={tournament} className={classes.section} />
    </div>
  );
};
