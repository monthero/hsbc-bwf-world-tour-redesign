import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { clsx } from 'clsx';
import { memo } from 'react';

import { LIVE_NOW, medalStake } from '~/components/match';
import { LiveDot, SectionTitle } from '~/components/ui';
import { useMatchStream } from '~/hooks/useTournamentMedia';
import type { Match, Tournament } from '~/types';

import { LiveCard } from './LiveCard';
import { MatchShowdown } from './Showdown';
import { useLiveView } from './useLiveView';

import classes from './LiveSection.module.css';
import utils from '~/styles/utils.module.css';

const LIVE_ICON = <LiveDot pulse size={8} />;

const ON_COURT = msg({
  message: '{n, plural, one {# match on court} other {# matches on court}}',
  comment: 'Count next to the Live now title: matches being played right now',
});

const LiveItem = memo<{ match: Match; tournament: Tournament; onOpen: (id: string) => void }>(
  ({ match: m, tournament, onOpen }) => {
    const [ref, view] = useLiveView<HTMLDivElement>(tournament, m);
    const stream = useMatchStream(tournament, m);
    return <LiveCard ref={ref} match={m} view={view} stream={stream} onOpen={onOpen} className={classes.card} />;
  },
);

export const LiveSection = memo<{
  matches: Match[];
  tournament: Tournament;
  onOpen: (id: string) => void;
}>(({ matches, tournament, onOpen }) => {
  const { i18n } = useLingui();
  const n = matches.length;
  const [first] = matches;
  const hero = n === 1 && first && medalStake(first.round) ? first : null;
  const title = (
    <SectionTitle icon={LIVE_ICON} count={i18n._({ ...ON_COURT, values: { n } })}>
      {i18n._(LIVE_NOW)}
    </SectionTitle>
  );
  if (hero)
    return (
      <section className={classes.root}>
        <div className={utils.container}>{title}</div>
        <MatchShowdown match={hero} tournament={tournament} onOpen={onOpen} h2h />
      </section>
    );
  return (
    <section className={clsx(utils.container, classes.root)}>
      {title}
      <div
        className={clsx(utils.snapRow, utils.noScrollbar, classes.grid)}
        data-single={n === 1 || undefined}
        data-count={n}
        data-many={n > 4 || undefined}
      >
        {matches.map((m) => (
          <LiveItem key={m.id} match={m} tournament={tournament} onOpen={onOpen} />
        ))}
      </div>
    </section>
  );
});
