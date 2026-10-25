import { msg } from '@lingui/core/macro';
import { Plural, Trans, useLingui } from '@lingui/react/macro';
import { useDisclosure } from '@mantine/hooks';
import { memo, useMemo, type CSSProperties } from 'react';

import { EventTag, TeamPlayers } from '~/components/match';
import { AvatarGroup, PlayerAvatar, PlayerName } from '~/components/player';
import { MoreButton } from '~/components/ui';
import { SEASON_YEAR } from '~/constants';
import { formatRecord } from '~/utils/format';

import { PARTNER_LIMIT } from '../constants';
import type { PartnerRow, RivalRow } from '../types';
import { yearRange } from '../utils';
import { Section } from './parts';

import classes from './People.module.css';
import shared from './shared.module.css';

const AVATAR = 28;

const WON_LOST_LABEL = msg({
  message: '{wins, plural, one {# win} other {# wins}}, {losses, plural, one {# loss} other {# losses}}',
  comment: 'Accessible label for a won–lost record bar',
});

const WON_LOST = (
  <span className={shared.sub}>
    <Trans comment="Column header: head-to-head or partnership record as matches won–lost (W–L), e.g. 5–2">
      Won–lost
    </Trans>
  </span>
);

const HeadToHead = memo<{ wins: number; losses: number }>(({ wins, losses }) => {
  const { i18n } = useLingui();
  const style = useMemo(() => ({ '--won': wins / Math.max(1, wins + losses) }) as CSSProperties, [wins, losses]);
  const label = i18n._({ ...WON_LOST_LABEL, values: { wins, losses } });
  return (
    <span className={classes.h2h} aria-label={label}>
      <span className={classes.record}>{formatRecord(wins, losses)}</span>
      <span className={classes.bar} style={style} aria-hidden />
    </span>
  );
});

const RivalItem = memo<{ row: RivalRow }>(({ row: r }) => {
  const meetings = r.wins + r.losses;
  return (
    <div className={shared.row} data-lead>
      <AvatarGroup players={r.players} size={AVATAR} />
      <span className={shared.rowMain}>
        <TeamPlayers players={r.players} flag="xs" truncate className={shared.rowNames} />
        <span className={shared.rowMeta}>
          <Plural
            value={meetings}
            one="# meeting"
            other="# meetings"
            comment="Number of matches played against these opponents"
          />
        </span>
      </span>
      <HeadToHead wins={r.wins} losses={r.losses} />
    </div>
  );
});

export const RivalsSection = memo<{ rows: RivalRow[] }>(({ rows }) => (
  <Section
    label={<Trans comment="Section title: the opponents the player has faced most often">Most played</Trans>}
    aside={WON_LOST}
  >
    <div className={shared.rows}>
      {rows.map((r) => (
        <RivalItem key={r.key} row={r} />
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
    <Section label={<Trans comment="Section title: the player’s doubles partners">Partners</Trans>} aside={WON_LOST}>
      <div className={shared.rows}>
        {shown.map((r) => (
          <PartnerItem key={r.key} row={r} multi={multi} />
        ))}
      </div>
      {hidden > 0 && <MoreButton count={hidden} onClick={showAll} />}
    </Section>
  );
});

const PartnerItem = memo<{ row: PartnerRow; multi: boolean }>(({ row: r, multi }) => {
  const { matches, titles } = r;
  return (
    <div className={shared.row} data-lead>
      <PlayerAvatar player={r.partner} size={AVATAR} link />
      <span className={shared.rowMain}>
        <span className={classes.nameLine}>
          <PlayerName player={r.partner} className={shared.rowNames} />
          {r.last >= SEASON_YEAR && (
            <span className={classes.current}>
              <Trans comment="Badge next to a doubles partner the player still plays with this season">Current</Trans>
            </span>
          )}
        </span>
        <span className={shared.rowMeta}>
          {multi && <EventTag event={r.event} />}
          <span>{yearRange(r.first, r.last)}</span>
          <span>
            <Plural value={matches} one="# match" other="# matches" />
          </span>
          {titles > 0 && (
            <span className={classes.titles}>
              <Plural value={titles} one="# title" other="# titles" />
            </span>
          )}
        </span>
      </span>
      <HeadToHead wins={r.wins} losses={r.losses} />
    </div>
  );
});
