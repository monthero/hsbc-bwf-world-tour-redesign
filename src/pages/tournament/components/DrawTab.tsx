import { getRouteApi } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { useCallback, useMemo, type FC } from 'react';

import { FlagTipGroup } from '~/components/country';
import { EmptyState, Segmented } from '~/components/ui';
import { EVENT_NAMES, EVENT_OPTIONS } from '~/constants';
import { useIsMobile } from '~/hooks/useIsMobile';
import type { EventCode } from '~/types';

import { useOpenMatch } from '../hooks';
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
  const navigate = route.useNavigate();
  const onOpen = useOpenMatch();
  const mobile = useIsMobile();

  const live = tournament.status === 'live';
  const has = useMemo(() => hasDraw(schedule, draw, ev), [schedule, draw, ev]);
  const bracket = useMemo(() => (has ? buildBracket(schedule, draw, ev, live) : null), [has, schedule, draw, ev, live]);

  const onEvent = useCallback(
    (v: EventCode | null) => v && navigate({ search: (s) => ({ ...s, draw: v }), replace: true, resetScroll: false }),
    [navigate],
  );
  const onRound = useCallback(
    (r: number) => navigate({ search: (s) => ({ ...s, round: r }), replace: true, resetScroll: false }),
    [navigate],
  );

  return (
    <section className={clsx(utils.container, page.tabSection, classes.section)}>
      <Segmented options={EVENT_OPTIONS} value={ev} onChange={onEvent} maxWidth={420} center />
      {!bracket ? (
        <EmptyState>{EVENT_NAMES[ev]} isn’t in today’s order of play data yet.</EmptyState>
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
