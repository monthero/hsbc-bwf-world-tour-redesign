import { ActionIcon } from '@mantine/core';
import { useClipboard } from '@mantine/hooks';
import { memo, useCallback, type FC } from 'react';

import { IconCheck, IconFacebook, IconLink, IconShare, IconWeibo, IconX, type IconProps, Tip } from '~/components/ui';
import { useIsMobile } from '~/hooks/useIsMobile';

import { COPIED_MS } from '../constants';

import classes from './ShareBar.module.css';

interface ShareTarget {
  label: string;
  icon: FC<IconProps>;
  href: (url: string, title: string) => string;
}

const enc = encodeURIComponent;

const SHARE_TARGETS: readonly ShareTarget[] = [
  {
    label: 'Weibo',
    icon: IconWeibo,
    href: (url, title) => `https://service.weibo.com/share/share.php?url=${enc(url)}&title=${enc(title)}`,
  },
  { label: 'Facebook', icon: IconFacebook, href: (url) => `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}` },
  { label: 'X', icon: IconX, href: (url, title) => `https://x.com/intent/post?text=${enc(title)}&url=${enc(url)}` },
];

const canShare = () => typeof navigator !== 'undefined' && typeof navigator.share === 'function';

const pageUrl = () => window.location.href;

const ShareLinks = memo<{ title: string }>(({ title }) => {
  const url = pageUrl();
  return SHARE_TARGETS.map(({ label, icon: Icon, href }) => (
    <Tip tap={false} key={label} label={`Share on ${label}`}>
      <ActionIcon
        component="a"
        href={href(url, title)}
        target="_blank"
        rel="noreferrer"
        variant="soft"
        radius="xl"
        size={32}
        aria-label={`Share on ${label}`}
        className={classes.icon}
      >
        <Icon />
      </ActionIcon>
    </Tip>
  ));
});

export const ShareBar = memo<{ title: string }>(({ title }) => {
  const isMobile = useIsMobile();
  const clipboard = useClipboard({ timeout: COPIED_MS });
  const share = useCallback(() => void navigator.share({ title, url: pageUrl() }).catch(() => undefined), [title]);
  const copy = useCallback(() => clipboard.copy(pageUrl()), [clipboard]);
  const copyLabel = clipboard.copied ? 'Link copied' : 'Copy link';

  if (isMobile && canShare())
    return (
      <ActionIcon variant="soft" radius="xl" size={32} onClick={share} aria-label="Share" className={classes.icon}>
        <IconShare />
      </ActionIcon>
    );

  return (
    <div className={classes.bar}>
      <ShareLinks title={title} />
      <Tip tap={false} label={copyLabel}>
        <ActionIcon variant="soft" radius="xl" size={32} onClick={copy} aria-label={copyLabel} className={classes.icon}>
          {clipboard.copied ? <IconCheck /> : <IconLink />}
        </ActionIcon>
      </Tip>
    </div>
  );
});
