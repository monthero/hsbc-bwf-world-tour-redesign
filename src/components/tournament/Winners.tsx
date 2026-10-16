import { Trans } from '@lingui/react/macro';
import { HoverCard, type FloatingPosition } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { clsx } from 'clsx';
import type { FC, ReactElement } from 'react';

import { TeamPlayers } from '~/components/match/TeamPlayers';
import { IconNext } from '~/components/ui';
import { EVENT_NAMES } from '~/constants';
import { PlayerHoverContext } from '~/contexts';
import type { Tournament } from '~/types';
import { hasWinners, tournamentParams } from '~/utils/tournaments';

import classes from './Winners.module.css';
import discipline from '~/styles/discipline.module.css';
import utils from '~/styles/utils.module.css';

const HOVER_EVENTS = { hover: true, focus: false, touch: false };

export const WinnersList: FC<{ champions: Tournament['champions']; bordered?: boolean }> = ({
  champions,
  bordered,
}) => {
  return (
    <PlayerHoverContext value={null}>
      <div className={classes.winners} data-bordered={bordered || undefined}>
        {champions.map((c) => (
          <div key={c.event} className={classes.winnerRow}>
            <span className={clsx(classes.event, discipline.tone)} data-event={c.event}>
              {EVENT_NAMES[c.event]}
            </span>
            <TeamPlayers players={c.players} nameClassName={classes.player} />
          </div>
        ))}
      </div>
    </PlayerHoverContext>
  );
};

export const PodiumLink: FC<{ tournament: Pick<Tournament, 'year' | 'slug'> }> = ({ tournament }) => {
  return (
    <Link
      to="/world-tour/$year/$slug"
      params={tournamentParams(tournament)}
      search={{ tab: 'podium' }}
      className={classes.podium}
    >
      <Trans comment="Link to a tournament’s full list of medallists (winners, runners-up, semi-finalists)">
        Full podium
      </Trans>
      <IconNext size={13} />
    </Link>
  );
};

export const WinnersHoverCard: FC<{
  tournament: Tournament;
  position: FloatingPosition;
  nested?: boolean;
  children: ReactElement;
}> = ({ tournament: t, position, nested, children }) => {
  if (!hasWinners(t)) return children;
  return (
    <HoverCard
      position={position}
      offset={10}
      width={320}
      openDelay={nested ? 120 : 280}
      closeDelay={200}
      events={HOVER_EVENTS}
      withinPortal={!nested}
      floatingStrategy={nested ? 'fixed' : 'absolute'}
    >
      <HoverCard.Target>{children}</HoverCard.Target>
      <HoverCard.Dropdown className={clsx(utils.popover, classes.dropdown)}>
        <WinnersList champions={t.champions} />
        <PodiumLink tournament={t} />
      </HoverCard.Dropdown>
    </HoverCard>
  );
};
