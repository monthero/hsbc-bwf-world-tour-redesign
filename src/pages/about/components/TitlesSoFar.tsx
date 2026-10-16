import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { Plural, Trans, useLingui } from '@lingui/react/macro';
import { clsx } from 'clsx';
import { memo, type CSSProperties, type FC } from 'react';

import { Flag } from '~/components/country';
import { PlayerAvatar, PlayerName } from '~/components/player';
import { SectionTitle } from '~/components/ui';
import type { Player } from '~/types';

import type { NationTitles, TitlesSummary } from '../types';

import classes from './TitlesSoFar.module.css';
import utils from '~/styles/utils.module.css';

const EVENTS_AND_TITLES = msg({
  message: '{events, plural, one {# event} other {# events}} · {titles, plural, one {# title} other {# titles}}',
  comment:
    'About page “titles so far” card: tournaments completed this season and titles (one per discipline) won in them',
});

const NationBar = memo<{ nation: NationTitles }>(({ nation: n }) => (
  <li className={classes.bar} style={{ '--w': `${n.share * 100}%` } as CSSProperties}>
    <Flag cc={n.cc} />
    <span className={classes.cc}>{n.cc}</span>
    <span className={classes.track} />
    <span className={clsx(utils.num, classes.n)}>{n.titles}</span>
  </li>
));

const LeadText: FC<{ player: Player; others: number; most: number }> = ({ player, others, most }) =>
  others ? (
    <Trans comment="About page “titles so far” card: a player is tied with others for the most titles (tournament wins) this season">
      <PlayerName player={player} className={classes.leadName} /> and{' '}
      <Plural value={others} one="# other" other="# others" /> lead with{' '}
      <Plural value={most} one="# title" other="# titles" /> each
    </Trans>
  ) : (
    <Trans comment="About page “titles so far” card: the player with the most titles (tournament wins) this season">
      <PlayerName player={player} className={classes.leadName} /> leads with{' '}
      <Plural value={most} one="# title" other="# titles" />
    </Trans>
  );

const Leader: FC<{ leaders: Player[]; most: number }> = ({ leaders, most }) => {
  const [p] = leaders;
  if (!p) return null;
  return (
    <p className={classes.leader}>
      <PlayerAvatar player={p} size={32} link />
      <span className={classes.leadText}>
        <LeadText player={p} others={leaders.length - 1} most={most} />
      </span>
      <Flag cc={p.cc} />
    </p>
  );
};

export const TitlesSoFar = memo<{ summary: TitlesSummary; heading: MessageDescriptor }>(({ summary: s, heading }) => {
  const { i18n } = useLingui();
  const { events, titles } = s;
  return (
    <div className={clsx(utils.card, classes.card)}>
      <SectionTitle as="h3" count={i18n._({ ...EVENTS_AND_TITLES, values: { events, titles } })}>
        {i18n._(heading)}
      </SectionTitle>
      <ol className={classes.bars}>
        {s.nations.map((n) => (
          <NationBar key={n.cc} nation={n} />
        ))}
      </ol>
      <Leader leaders={s.leaders} most={s.most} />
    </div>
  );
});
