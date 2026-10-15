import { memo, useCallback, useMemo, type FC } from 'react';

import { StarButton, Tip, type StarBox, type StarVariant } from '~/components/ui';
import {
  useArePlayersFavorite,
  useFavorites,
  useIsFavorite,
  useIsImpliedFavorite,
  type FavoritePlayerRef,
} from '~/stores/favorites';
import type { Continent } from '~/types';
import { continentOf } from '~/utils/countries';

type FollowTarget =
  | { players: readonly FavoritePlayerRef[] }
  | { kind: 'country'; id: string }
  | { kind: 'continent'; id: Continent }
  | { kind: 'tournament'; id: string; meta: { name: string; slug: string; year: number } };

export interface FollowLook {
  name?: string;
  variant?: StarVariant;
  box?: StarBox;
  iconSize?: number;
  className?: string;
}

type FollowButtonProps = FollowTarget & FollowLook;

const View: FC<FollowLook & { active: boolean; implied?: boolean; fallback: string; onToggle: () => void }> = ({
  active,
  implied,
  fallback,
  onToggle,
  name,
  variant,
  box,
  iconSize,
  className,
}) => {
  const who = name ?? fallback;
  const label = active ? `Unfollow ${who}` : `Follow ${who}`;
  return (
    <Tip tap={false} label={label}>
      <StarButton
        active={active}
        implied={implied}
        label={label}
        size={iconSize}
        box={box}
        variant={variant}
        className={className}
        onClick={onToggle}
      />
    </Tip>
  );
};

const PlayersFollow: FC<FollowLook & { players: readonly FavoritePlayerRef[] }> = ({ players, ...look }) => {
  const ids = useMemo(() => players.map((p) => p.id), [players]);
  const active = useArePlayersFavorite(ids);
  const implied = useIsImpliedFavorite(players);
  const togglePlayers = useFavorites((s) => s.togglePlayers);
  const onToggle = useCallback(() => togglePlayers(players), [togglePlayers, players]);
  return (
    <View
      {...look}
      active={active}
      implied={implied}
      fallback={players.length > 1 ? 'this pair' : 'player'}
      onToggle={onToggle}
    />
  );
};

type EntityTarget = Exclude<FollowTarget, { players: readonly FavoritePlayerRef[] }>;

const EntityFollow: FC<FollowLook & { target: EntityTarget }> = ({ target, ...look }) => {
  const active = useIsFavorite(target.kind, target.id);
  const implied = useFavorites((s) => target.kind === 'country' && s.continents[continentOf(target.id)] !== undefined);
  const toggle = useFavorites((s) => s.toggle);
  const onToggle = useCallback(() => {
    if (target.kind === 'tournament') toggle('tournament', target.id, target.meta);
    else if (target.kind === 'continent') toggle('continent', target.id);
    else toggle('country', target.id);
  }, [toggle, target]);
  return <View {...look} active={active} implied={implied} fallback={target.id} onToggle={onToggle} />;
};

export const FollowButton = memo<FollowButtonProps>((props) => {
  if ('players' in props) return <PlayersFollow {...props} />;
  const { name, variant, box, iconSize, className, ...target } = props;
  return (
    <EntityFollow
      target={target as EntityTarget}
      name={name}
      variant={variant}
      box={box}
      iconSize={iconSize}
      className={className}
    />
  );
});

export const PlayerFollow = memo<FollowLook & { player: FavoritePlayerRef }>(({ player, ...look }) => {
  const players = useMemo(() => [player], [player]);
  return <PlayersFollow players={players} {...look} />;
});
