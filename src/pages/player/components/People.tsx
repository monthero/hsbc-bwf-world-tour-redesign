import { useDisclosure } from '@mantine/hooks';
import { memo, useMemo, type CSSProperties } from 'react';

import { TeamPlayers } from '~/components/match';
import { AvatarGroup, PlayerAvatar, PlayerName } from '~/components/player';
import { MoreButton } from '~/components/ui';
import { EVENT_NAMES, SEASON_YEAR } from '~/constants';
import { plural } from '~/utils/format';

import { PARTNER_LIMIT } from '../constants';
import type { PartnerRow, RivalRow } from '../types';
import { yearRange } from '../utils';
import { Section } from './parts';

import classes from './People.module.css';
import shared from './shared.module.css';

const AVATAR = 28;

const edge = (wins: number, losses: number) => {
  if (wins === losses) return 'even';
  return wins > losses ? 'ahead' : 'behind';
};

const HeadToHead = memo<{ wins: number; losses: number }>(({ wins, losses }) => {
  const style = useMemo(() => ({ '--won': wins / Math.max(1, wins + losses) }) as CSSProperties, [wins, losses]);
  return (
    <span className={classes.h2h} data-edge={edge(wins, losses)} aria-label={`${wins} wins, ${losses} losses`}>
      <span className={classes.record}>
        {wins}–{losses}
      </span>
      <span className={classes.bar} style={style} aria-hidden />
    </span>
  );
});

export const RivalsSection = memo<{ rows: RivalRow[] }>(({ rows }) => (
  <Section label="Most played" aside={<span className={shared.sub}>Won–lost</span>}>
    <div className={shared.rows}>
      {rows.map((r) => (
        <div key={r.key} className={shared.row} data-lead>
          <AvatarGroup players={r.players} size={AVATAR} />
          <span className={shared.rowMain}>
            <TeamPlayers players={r.players} flag="xs" truncate className={shared.rowNames} />
            <span className={shared.rowMeta}>{plural(r.wins + r.losses, 'meeting')}</span>
          </span>
          <HeadToHead wins={r.wins} losses={r.losses} />
        </div>
      ))}
    </div>
  </Section>
));

export const PartnersSection = memo<{ rows: PartnerRow[] }>(({ rows }) => {
  const [all, { open: showAll }] = useDisclosure(false);
  const multi = useMemo(() => new Set(rows.map((r) => r.event)).size > 1, [rows]);
  const shown = all ? rows : rows.slice(0, PARTNER_LIMIT);
  const hidden = rows.length - shown.length;
  return (
    <Section label="Partners" aside={<span className={shared.sub}>Won–lost</span>}>
      <div className={shared.rows}>
        {shown.map((r) => (
          <div key={r.key} className={shared.row} data-lead>
            <PlayerAvatar player={r.partner} size={AVATAR} link />
            <span className={shared.rowMain}>
              <span className={classes.nameLine}>
                <PlayerName player={r.partner} className={shared.rowNames} />
                {r.last >= SEASON_YEAR && <span className={classes.current}>Current</span>}
              </span>
              <span className={shared.rowMeta}>
                {multi && <span>{EVENT_NAMES[r.event]}</span>}
                <span>{yearRange(r.first, r.last)}</span>
                <span>{plural(r.matches, 'match', 'matches')}</span>
                {r.titles > 0 && <span className={classes.titles}>{plural(r.titles, 'title')}</span>}
              </span>
            </span>
            <HeadToHead wins={r.wins} losses={r.losses} />
          </div>
        ))}
      </div>
      {hidden > 0 && <MoreButton count={hidden} onClick={showAll} />}
    </Section>
  );
});
