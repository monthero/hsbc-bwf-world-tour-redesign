import { clsx } from 'clsx';
import { memo, type FC } from 'react';

import { IconFacebook, IconInstagram, Tip, type IconProps } from '~/components/ui';
import type { FactItem } from '~/types';

import classes from './SocialLinks.module.css';

const SOCIAL_ICONS: Partial<Record<string, FC<IconProps>>> = { instagram: IconInstagram, facebook: IconFacebook };

const ICON_SIZE = { sm: 15, md: 18 } as const;

type LinkSize = keyof typeof ICON_SIZE;

const Social = memo<{ link: FactItem; size: LinkSize }>(({ link: l, size }) => {
  const Icon = SOCIAL_ICONS[l.key];
  return (
    <Tip label={l.label} tap={false}>
      <a
        href={l.value}
        target="_blank"
        rel="noreferrer"
        aria-label={l.label}
        className={classes.social}
        data-size={size}
      >
        {Icon ? <Icon size={ICON_SIZE[size]} /> : l.label}
      </a>
    </Tip>
  );
});

export const SocialLinks = memo<{ links: readonly FactItem[]; size?: LinkSize; className?: string }>(
  ({ links, size = 'md', className }) =>
    links.length > 0 && (
      <span className={clsx(classes.links, className)}>
        {links.map((l) => (
          <Social key={l.key} link={l} size={size} />
        ))}
      </span>
    ),
);
