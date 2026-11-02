import { Trans } from '@lingui/react/macro';
import { getRouteApi } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { useCallback, useMemo, type FC } from 'react';

import { FlagTipGroup } from '~/components/country';
import { EmptyState, Segmented } from '~/components/ui';
import { EVENT_NAMES, EVENT_OPTIONS } from '~/constants';
import { useIsMobile } from '~/hooks/useIsMobile';
import { useTeamRank } from '~/hooks/useTeamRank';
import type { EventCode } from '~/types';
import { isBigMatch } from '~/utils/rankings';

import { useOpenMatch, useUpdateSearch } from '../hooks';
import type { TabProps } from '../types';
import { buildBracket, currentRound, hasDraw, type BracketBox } from './draw/bracket';
import { BracketView } from './draw/BracketView';
import { MobileDraw } from './draw/MobileDraw';
import { FlameToggle } from './matches/FilterControls';

import page from '../TournamentPage.module.css';
import classes from './draw/Draw.module.css';
import utils from '~/styles/utils.module.css';

const route = getRouteApi('/world-tour/$year/$slug');

export const DrawTab: FC<TabProps> = ({ tournament, schedule, draw }) => {
  const ev = route.useSearch({ select: (s) => s.draw ?? 'MS' });
  const round = route.useSearch({ select: (s) => s.round });
  const flame = route.useSearch({ select: (s) => !!s.flame });
  const teamRank = useTeamRank();
  const update = useUpdateSearch();
  const onOpen = useOpenMatch();
  const mobile = useIsMobile();

  const live = tournament.status === 'live';
  const event = EVENT_NAMES[ev];
  const has = useMemo(() => hasDraw(schedule, draw, ev), [schedule, draw, ev]);
  const bracket = useMemo(() => (has ? buildBracket(schedule, draw, ev, live) : null), [has, schedule, draw, ev, live]);
  const current = bracket ? currentRound(bracket, tournament.status) : 0;

  const onEvent = useCallback((v: EventCode | null) => v && update({ draw: v }), [update]);
  const onRound = useCallback((r: number) => update({ round: r }), [update]);
  const onFlame = useCallback(() => update((s) => ({ flame: s.flame ? undefined : true })), [update]);
  const dim = useMemo(
    () => (flame ? (box: BracketBox) => !isBigMatch(box.teams[0], box.teams[1], ev, teamRank) : undefined),
    [flame, ev, teamRank],
  );

  return (
    <section className={clsx(utils.container, page.tabSection, classes.section)}>
      <div className={classes.controls}>
        <Segmented options={EVENT_OPTIONS} value={ev} onChange={onEvent} maxWidth={420} className={classes.events} />
        <FlameToggle variant="inline" active={flame} onToggle={onFlame} highlight />
      </div>
      {!bracket ? (
        <EmptyState>
          <Trans comment="Draw tab empty state. {event} is an event name, e.g. Men’s singles. The order of play is the daily match schedule">
            {event} isn’t in today’s order of play data yet.
          </Trans>
        </EmptyState>
      ) : (
        <FlagTipGroup>
          {mobile ? (
            <MobileDraw bracket={bracket} round={round ?? current} onRound={onRound} onOpen={onOpen} dim={dim} />
          ) : (
            <BracketView bracket={bracket} onOpen={onOpen} dim={dim} />
          )}
        </FlagTipGroup>
      )}
    </section>
  );
};
