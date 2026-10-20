import { Trans, useLingui } from '@lingui/react/macro';
import { memo } from 'react';

import { CardHit } from '~/components/ui';
import { EVENT_NAMES } from '~/constants';
import type { Match } from '~/types';
import { detailsLabel, matchTitle } from '~/utils/matches';

import { LIVE_NOW } from './labels';
import { LiveMark } from './LiveMark';
import { MatchTime } from './MatchTime';
import { TeamLabel } from './TeamPlayers';

import classes from './FollowRow.module.css';
import utils from '~/styles/utils.module.css';

export const FollowRow = memo<{ match: Match; onOpen: (id: string) => void; compact?: boolean }>(
  ({ match: m, onOpen, compact }) => {
    const { i18n } = useLingui();
    const live = m.status === 'P';
    const home = <TeamLabel players={m.teams[0].players} sep=" & " />;
    const away = <TeamLabel players={m.teams[1].players} sep=" & " />;
    const { court } = m;
    const event = EVENT_NAMES[m.event];
    return (
      <div className={classes.row} data-variant={compact ? 'compact' : undefined}>
        <CardHit label={detailsLabel(matchTitle(m))} onClick={() => onOpen(m.id)} />
        <span className={classes.time} data-live={live || undefined}>
          <MatchTime match={m} stacked />
        </span>
        <span className={classes.body}>
          <span className={utils.ellipsis}>
            <Trans comment="The two sides of a match, e.g. “Axelsen vs Shi”">
              {home} vs {away}
            </Trans>
          </span>
          <span className={classes.meta}>
            {live && <LiveMark label={i18n._(LIVE_NOW)} size={6} />}
            <Trans comment="Where and what a followed match is: the court number and the event, e.g. “Court 2 · Men’s singles”">
              Court {court} · {event}
            </Trans>
          </span>
        </span>
      </div>
    );
  },
);
