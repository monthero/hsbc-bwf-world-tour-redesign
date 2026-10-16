import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { memo, type ComponentProps } from 'react';

import { TeamPlayers } from '~/components/match';
import { IconExternal, Tip } from '~/components/ui';
import type { Player } from '~/types';
import { isKnown } from '~/utils/rankings';

import classes from './RankedNames.module.css';

const BWF_PLAYER_URL = 'https://bwfbadminton.com/player/';

const BWF_PROFILE = msg({
  message: 'Profile on bwfbadminton.com',
  comment: 'Link to a player’s profile on the official BWF website, for players without a page on this site',
});

const BwfLink = memo<{ id: string }>(({ id }) => {
  const { i18n } = useLingui();
  const label = i18n._(BWF_PROFILE);
  return (
    <Tip label={label} tap={false}>
      <a href={`${BWF_PLAYER_URL}${id}/`} target="_blank" rel="noreferrer" className={classes.ext} aria-label={label}>
        <IconExternal size={12} />
      </a>
    </Tip>
  );
});

const externalAfter = (p: Player) => (isKnown(p) ? null : <BwfLink id={p.id} />);

export const RankedNames = memo<Omit<ComponentProps<typeof TeamPlayers>, 'link' | 'after'>>((props) => (
  <TeamPlayers {...props} link={isKnown} after={externalAfter} />
));
