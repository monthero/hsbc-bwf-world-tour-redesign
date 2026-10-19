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

const LEADS = msg({
  message: '{most, plural, one {Leads with # title} other {Leads with # titles}}',
  comment:
    'About page “titles so far” card, at the end of the row with the player who has won the most titles (tournaments) this season, shown next to their name',
});

const LEAD_TIE = msg({
  message: '{most, plural, one {Lead with # title each} other {Lead with # titles each}}',
  comment:
    'About page “titles so far” card, at the end of the row when several players are tied for the most titles (tournaments) this season, shown next to their names',
});

const LeadName: FC<{ player: Player; others: number }> = ({ player, others }) =>
  others ? (
    <Trans comment="About page “titles so far” card: the first of several players tied for the most titles this season, and how many others share it">
      <PlayerName player={player} className={classes.leadName} /> and{' '}
      <Plural value={others} one="# other" other="# others" />
    </Trans>
  ) : (
    <PlayerName player={player} className={classes.leadName} />
  );

const Leader: FC<{ leaders: Player[]; most: number }> = ({ leaders, most }) => {
  const { i18n } = useLingui();
  const [p] = leaders;
  if (!p) return null;
  return (
    <p className={classes.leader}>
      <Flag cc={p.cc} />
      <PlayerAvatar player={p} size={32} link />
      <span className={classes.leadText}>
        <LeadName player={p} others={leaders.length - 1} />
      </span>
      <span className={classes.leadCount}>
        {i18n._({ ...(leaders.length > 1 ? LEAD_TIE : LEADS), values: { most } })}
      </span>
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
