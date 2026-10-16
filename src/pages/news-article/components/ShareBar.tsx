import { useLingui } from '@lingui/react/macro';
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

const ShareLink = memo<{ target: ShareTarget; url: string; title: string }>(({ target, url, title }) => {
  const { t } = useLingui();
  const { label: network, icon: Icon, href } = target;
  const label = t({
    message: `Share on ${network}`,
    comment: 'Button sharing a news article on a social network; {network} is its brand name (Weibo, Facebook, X)',
  });
  return (
    <Tip tap={false} label={label}>
      <ActionIcon
        component="a"
        href={href(url, title)}
        target="_blank"
        rel="noreferrer"
        variant="soft"
        radius="xl"
        size={32}
        aria-label={label}
        className={classes.icon}
      >
        <Icon />
      </ActionIcon>
    </Tip>
  );
});

const ShareLinks = memo<{ title: string }>(({ title }) => {
  const url = pageUrl();
  return SHARE_TARGETS.map((target) => <ShareLink key={target.label} target={target} url={url} title={title} />);
});

export const ShareBar = memo<{ title: string }>(({ title }) => {
  const isMobile = useIsMobile();
  const { t } = useLingui();
  const clipboard = useClipboard({ timeout: COPIED_MS });
  const share = useCallback(() => void navigator.share({ title, url: pageUrl() }).catch(() => undefined), [title]);
  const copy = useCallback(() => clipboard.copy(pageUrl()), [clipboard]);
  const copyLabel = clipboard.copied
    ? t({ message: 'Link copied', comment: 'Confirmation after copying a news article’s link to the clipboard' })
    : t({ message: 'Copy link', comment: 'Button that copies a news article’s link to the clipboard' });

  if (isMobile && canShare())
    return (
      <ActionIcon
        variant="soft"
        radius="xl"
        size={32}
        onClick={share}
        aria-label={t({ message: 'Share', comment: 'Button opening the phone’s share sheet for a news article' })}
        className={classes.icon}
      >
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
