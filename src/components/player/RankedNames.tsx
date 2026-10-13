import { memo, type ComponentProps } from 'react';

import { TeamPlayers } from '~/components/match';
import { IconExternal } from '~/components/ui';
import type { Player } from '~/types';
import { isKnown } from '~/utils/rankings';

import classes from './RankedNames.module.css';

const BWF_PLAYER_URL = 'https://bwfbadminton.com/player/';

const BwfLink = memo<{ id: string }>(({ id }) => (
  <a
    href={`${BWF_PLAYER_URL}${id}/`}
    target="_blank"
    rel="noreferrer"
    className={classes.ext}
    aria-label="Profile on bwfbadminton.com"
    title="Profile on bwfbadminton.com"
  >
    <IconExternal size={12} />
  </a>
));

const externalAfter = (p: Player) => (isKnown(p) ? null : <BwfLink id={p.id} />);

export const RankedNames = memo<Omit<ComponentProps<typeof TeamPlayers>, 'link' | 'after'>>((props) => (
  <TeamPlayers {...props} link={isKnown} after={externalAfter} />
));
