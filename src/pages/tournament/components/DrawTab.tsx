import { Trans } from '@lingui/react/macro';
import { getRouteApi } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { useCallback, useMemo, type FC } from 'react';

import { FlagTipGroup } from '~/components/country';
import { EmptyState, Segmented } from '~/components/ui';
import { EVENT_NAMES, EVENT_OPTIONS } from '~/constants';
import { useIsMobile } from '~/hooks/useIsMobile';
import type { EventCode } from '~/types';

import { useOpenMatch, useUpdateSearch } from '../hooks';
import type { TabProps } from '../types';
import { buildBracket, hasDraw } from './draw/bracket';
import { BracketView } from './draw/BracketView';
import { MobileDraw } from './draw/MobileDraw';

import page from '../TournamentPage.module.css';
import classes from './draw/Draw.module.css';
import utils from '~/styles/utils.module.css';

const route = getRouteApi('/world-tour/$year/$slug');

export const DrawTab: FC<TabProps> = ({ tournament, schedule, draw }) => {
  const ev = route.useSearch({ select: (s) => s.draw ?? 'MS' });
  const round = route.useSearch({ select: (s) => s.round ?? 0 });
  const update = useUpdateSearch();
  const onOpen = useOpenMatch();
  const mobile = useIsMobile();

  const live = tournament.status === 'live';
  const event = EVENT_NAMES[ev];
  const has = useMemo(() => hasDraw(schedule, draw, ev), [schedule, draw, ev]);
  const bracket = useMemo(() => (has ? buildBracket(schedule, draw, ev, live) : null), [has, schedule, draw, ev, live]);

  const onEvent = useCallback((v: EventCode | null) => v && update({ draw: v }), [update]);
  const onRound = useCallback((r: number) => update({ round: r }), [update]);

  return (
    <section className={clsx(utils.container, page.tabSection, classes.section)}>
      <Segmented options={EVENT_OPTIONS} value={ev} onChange={onEvent} maxWidth={420} center />
      {!bracket ? (
        <EmptyState>
          <Trans comment="Draw tab empty state. {event} is an event name, e.g. Men’s singles. The order of play is the daily match schedule">
            {event} isn’t in today’s order of play data yet.
          </Trans>
        </EmptyState>
      ) : (
        <FlagTipGroup>
          {mobile ? (
            <MobileDraw bracket={bracket} round={round} onRound={onRound} onOpen={onOpen} />
          ) : (
            <BracketView bracket={bracket} onOpen={onOpen} />
          )}
        </FlagTipGroup>
      )}
    </section>
  );
};
