import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { clamp } from '@mantine/hooks';
import { useQuery } from '@tanstack/react-query';
import { clsx } from 'clsx';
import { memo, type CSSProperties } from 'react';

import type { LiveServer } from '~/api/bwf/normalize';
import { liveGameStatsQuery, liveMatchStatsQuery, liveServersQuery } from '~/api/queries';
import { LiveDot, SectionTitle } from '~/components/ui';
import { useMatchStream } from '~/hooks/useTournamentMedia';
import type { Match, Tournament } from '~/types';

import { LIVE_NOW } from '../../constants';
import { LiveCard } from './LiveCard';

import classes from './LiveSection.module.css';
import utils from '~/styles/utils.module.css';

const LIVE_ICON = <LiveDot pulse size={8} />;
const CHALLENGE_SHOW_MS = 60_000;

const ON_COURT = msg({
  message: '{n, plural, one {# match on court} other {# matches on court}}',
  comment: 'Count next to the Live now title: matches being played right now',
});

const useLiveStats = (tmtId: number | null, m: Match) => {
  const enabled = !!tmtId && !!m.code;
  const q = useQuery({ ...liveMatchStatsQuery(tmtId ?? 0, m.code ?? ''), enabled });
  const g = useQuery({ ...liveGameStatsQuery(tmtId ?? 0, m.code ?? '', m.games.length + 1), enabled });
  const challenge = q.data?.challenge;
  return {
    stats: q.data ?? null,
    game: g.data ?? null,
    challenge: challenge && q.dataUpdatedAt - challenge.at < CHALLENGE_SHOW_MS ? challenge : null,
  };
};

const LiveItem = memo<{
  match: Match;
  tournament: Tournament;
  servers: Record<string, LiveServer> | undefined;
  onOpen: (id: string) => void;
}>(({ match: m, tournament, servers, onOpen }) => {
  const { stats, game, challenge } = useLiveStats(tournament.tmtId, m);
  const stream = useMatchStream(tournament, m);
  const server = m.code ? servers?.[m.code] : undefined;
  return (
    <LiveCard
      match={m}
      stats={stats}
      game={game}
      challenge={challenge}
      server={server}
      stream={stream}
      onOpen={onOpen}
      className={classes.card}
    />
  );
});

export const LiveSection = memo<{
  matches: Match[];
  tournament: Tournament;
  onOpen: (id: string) => void;
}>(({ matches, tournament, onOpen }) => {
  const { i18n } = useLingui();
  const n = matches.length;
  const tmtId = tournament.tmtId;
  const { data: servers } = useQuery({ ...liveServersQuery(tmtId ?? 0), enabled: !!tmtId });
  return (
    <section className={classes.root}>
      <SectionTitle icon={LIVE_ICON} count={i18n._({ ...ON_COURT, values: { n } })}>
        {i18n._(LIVE_NOW)}
      </SectionTitle>
      <div
        className={clsx(utils.snapRow, utils.noScrollbar, classes.grid)}
        data-single={n === 1 || undefined}
        style={{ '--cols': clamp(n, 2, 3) } as CSSProperties}
      >
        {matches.map((m) => (
          <LiveItem key={m.id} match={m} tournament={tournament} servers={servers} onOpen={onOpen} />
        ))}
      </div>
    </section>
  );
});
