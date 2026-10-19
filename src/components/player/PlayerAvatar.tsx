import { Link } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { memo, useState, type CSSProperties, type ReactEventHandler } from 'react';

import { useFaceBox } from '~/hooks/useFaceBox';
import { usePlayerLinkSearch } from '~/hooks/usePlayerLinkSearch';
import { usePlayerPhoto } from '~/hooks/usePlayers';
import type { PhotoCrop, Player } from '~/types';
import { isFaceCroppable, photoVars, playerPortraitUrl } from '~/utils/images';
import { initials } from '~/utils/names';

import classes from './PlayerAvatar.module.css';

type AvatarIdentity = { player: Pick<Player, 'id' | 'name'> } | { id: string; name: string };

type PlayerAvatarProps = AvatarIdentity & {
  photo?: string | null;
  size?: number;
  crop?: number;
  framing?: PhotoCrop | null;
  ring?: boolean;
  link?: boolean;
  className?: string;
};

export const FramedPhoto = memo<{
  src: string;
  framing: PhotoCrop | null;
  className?: string;
  onLoad?: ReactEventHandler<HTMLImageElement>;
}>(({ src, framing, className, onLoad }) => (
  <img
    src={src}
    alt=""
    loading="lazy"
    draggable={false}
    className={clsx(classes.photo, className)}
    style={photoVars(framing)}
    onLoad={onLoad}
  />
));

export const PlayerAvatar = memo<PlayerAvatarProps>((props) => {
  const { id, name } = 'player' in props ? props.player : props;
  const { photo, size, crop, framing, ring, link, className } = props;
  const { src, crop: shown } = usePlayerPhoto(id, { photo, size: crop, framing });
  const search = usePlayerLinkSearch();
  const [el, setEl] = useState<HTMLElement | null>(null);
  const faced = !size && !crop && !shown && isFaceCroppable(src);
  const box = useFaceBox(el, faced);
  const shownSrc = faced ? box && playerPortraitUrl(src, box.width, box.height) : src;
  const cls = clsx(classes.avatar, className);
  const attrs = {
    'data-fill': size ? undefined : true,
    'data-ring': ring || undefined,
    style: size ? ({ '--size': `${size}px` } as CSSProperties) : undefined,
  };
  const body = src ? shownSrc && <FramedPhoto src={shownSrc} framing={shown} /> : initials(name);
  if (link && id)
    return (
      <Link ref={setEl} to="/players/$id" params={{ id }} search={search} className={cls} tabIndex={-1} {...attrs}>
        {body}
      </Link>
    );
  return (
    <span ref={setEl} className={cls} {...attrs}>
      {body}
    </span>
  );
});

type AvatarMember = Pick<Player, 'id' | 'name'> & { photo?: string | null };

export const AvatarGroup = memo<{ players: readonly AvatarMember[]; size?: number; crop?: number; className?: string }>(
  ({ players, size = 48, crop, className }) => {
    return (
      <span className={clsx(classes.group, className)} style={{ '--size': `${size}px` } as CSSProperties}>
        {players.map((p) => (
          <PlayerAvatar
            key={p.id || p.name}
            player={p}
            photo={p.photo}
            size={size}
            crop={crop}
            className={classes.member}
          />
        ))}
      </span>
    );
  },
);
