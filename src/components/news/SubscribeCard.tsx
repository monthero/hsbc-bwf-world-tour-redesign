import { Button } from '@mantine/core';
import { clsx } from 'clsx';
import { memo } from 'react';

import { NEWSLETTER } from '~/components/layout/links';
import { IconExternal, IconNewsletter } from '~/components/ui';

const SUBSCRIBE_COPY = {
  full: { title: 'Subscribe to BWF newsletters', body: 'Free, personalised updates direct to your inbox.' },
  compact: { title: 'BWF newsletters', body: 'Free updates, straight to your inbox' },
} as const;

import classes from './SubscribeCard.module.css';

export const SubscribeCard = memo<{ compact?: boolean; className?: string }>(({ compact, className }) => {
  const copy = compact ? SUBSCRIBE_COPY.compact : SUBSCRIBE_COPY.full;
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
        <span className={classes.title}>{copy.title}</span>
        <span className={classes.body}>{copy.body}</span>
      </span>
      <Button
        component="span"
        color="red"
        radius="xl"
        size={compact ? 'md' : 'sm'}
        rightSection={<IconExternal />}
        className={classes.button}
      >
        Subscribe
      </Button>
    </a>
  );
});
