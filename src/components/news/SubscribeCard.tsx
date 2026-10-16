import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { Button } from '@mantine/core';
import { clsx } from 'clsx';
import { memo } from 'react';

import { NEWSLETTER } from '~/components/layout/links';
import { IconExternal, IconNewsletter } from '~/components/ui';

import classes from './SubscribeCard.module.css';

const SUBSCRIBE_COPY = {
  full: { title: msg`Subscribe to BWF newsletters`, body: msg`Free, personalised updates direct to your inbox.` },
  compact: { title: msg`BWF newsletters`, body: msg`Free updates, straight to your inbox` },
} as const;

export const SubscribeCard = memo<{ compact?: boolean; className?: string }>(({ compact, className }) => {
  const copy = compact ? SUBSCRIBE_COPY.compact : SUBSCRIBE_COPY.full;
  const { i18n } = useLingui();
  return (
    <a
      href={NEWSLETTER.href}
      target="_blank"
      rel="noreferrer"
      className={clsx(classes.card, className)}
      data-compact={compact || undefined}
    >
      <span className={classes.icon}>
        <IconNewsletter />
      </span>
      <span className={classes.text}>
        <span className={classes.title}>{i18n._(copy.title)}</span>
        <span className={classes.body}>{i18n._(copy.body)}</span>
      </span>
      <Button
        component="span"
        color="red"
        radius="xl"
        size={compact ? 'md' : 'sm'}
        rightSection={<IconExternal />}
        className={classes.button}
      >
        <Trans comment="Button to sign up for the BWF email newsletter">Subscribe</Trans>
      </Button>
    </a>
  );
});
