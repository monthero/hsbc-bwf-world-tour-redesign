import { Link } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { use, type FC, type MouseEvent } from 'react';

import { PlayerHoverContext } from '~/contexts';
import { usePlayerLinkSearch } from '~/hooks/useCurrentTournament';
import type { Player } from '~/types';

import classes from './PlayerName.module.css';

const stop = (e: MouseEvent) => e.stopPropagation();

export const PlayerName: FC<{
  player: Player;
  link?: boolean;
  layout?: 'inline' | 'stacked';
  short?: boolean;
  className?: string;
  firstClassName?: string;
  lastClassName?: string;
}> = ({ player, link = true, layout = 'inline', short, className, firstClassName, lastClassName }) => {
  const search = usePlayerLinkSearch();
  const renderHover = use(PlayerHoverContext);
  const cls = clsx(classes.playerName, className);
  const body = short ? (
    <span className={lastClassName} data-strong>
      {player.surname}
    </span>
  ) : (
    <>
      <span className={firstClassName} data-strong={player.surnameFirst || undefined}>
        {player.first}
      </span>
      {player.last && layout === 'inline' && ' '}
      {player.last && (
        <span className={lastClassName} data-strong={!player.surnameFirst || undefined}>
          {player.last}
        </span>
      )}
    </>
  );
  if (!link || !player.id)
    return (
      <span className={cls} data-layout={layout}>
        {body}
      </span>
    );
  const anchor = (
    <Link
      to="/players/$id"
      params={{ id: player.id }}
      search={search}
      className={cls}
      data-layout={layout}
      onClick={stop}
    >
      {body}
    </Link>
  );
  return renderHover ? renderHover(player.id, anchor) : anchor;
};
