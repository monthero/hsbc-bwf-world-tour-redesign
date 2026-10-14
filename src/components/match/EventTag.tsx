import { clsx } from 'clsx';
import { memo } from 'react';

import { LazyTip, useLazyTip } from '~/components/ui';
import { EVENT_NAMES } from '~/constants';
import type { EventCode } from '~/types';

import classes from './EventTag.module.css';

export type NoteTone = 'violet' | 'sky';

const Tag = memo<{ label: string; tip: string; tone?: NoteTone; className?: string }>(
  ({ label, tip, tone, className }) => {
    const lazy = useLazyTip<HTMLSpanElement>(true);
    return (
      <>
        <span className={clsx(classes.tag, className)} data-tone={tone} data-tip onPointerEnter={lazy.arm}>
          {label}
        </span>
        <LazyTip target={lazy.target} label={tip} />
      </>
    );
  },
);

export const EventTag = memo<{ event: EventCode; className?: string }>(({ event, className }) => (
  <Tag label={event} tip={EVENT_NAMES[event]} className={clsx(classes.eventTag, className)} />
));

export const NoteTag = memo<{ label: string; tip: string; tone: NoteTone }>(({ label, tip, tone }) => (
  <Tag label={label} tip={tip} tone={tone} className={classes.note} />
));
