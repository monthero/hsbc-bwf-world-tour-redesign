import { memo, type ComponentProps } from 'react';

import { TeamPlayers } from '~/components/match';
import { IconExternal, LazyTip, useLazyTip } from '~/components/ui';
import type { Player } from '~/types';
import { isKnown } from '~/utils/rankings';

import classes from './RankedNames.module.css';

const BWF_PLAYER_URL = 'https://bwfbadminton.com/player/';

const BWF_PROFILE = 'Profile on bwfbadminton.com';

const BwfLink = memo<{ id: string }>(({ id }) => {
  const lazy = useLazyTip<HTMLAnchorElement>(true);
  return (
    <>
      <a
        href={`${BWF_PLAYER_URL}${id}/`}
        target="_blank"
        rel="noreferrer"
        className={classes.ext}
        aria-label={BWF_PROFILE}
        onPointerEnter={lazy.arm}
      >
        <IconExternal size={12} />
      </a>
      <LazyTip target={lazy.target} label={BWF_PROFILE} />
    </>
  );
});

const externalAfter = (p: Player) => (isKnown(p) ? null : <BwfLink id={p.id} />);

export const RankedNames = memo<Omit<ComponentProps<typeof TeamPlayers>, 'link' | 'after'>>((props) => (
  <TeamPlayers {...props} link={isKnown} after={externalAfter} />
));
