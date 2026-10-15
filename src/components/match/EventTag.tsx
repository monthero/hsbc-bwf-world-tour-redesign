import { clsx } from 'clsx';
import { memo } from 'react';

import { Tip } from '~/components/ui';
import { EVENT_NAMES } from '~/constants';
import type { EventCode, Match } from '~/types';
import { noteLabel, noteTip } from '~/utils/matches';

import classes from './EventTag.module.css';
import discipline from '~/styles/discipline.module.css';

export type NoteTone = 'violet' | 'sky';

const NOTE_TONES: Partial<Record<string, NoteTone>> = { Walkover: 'sky', Retired: 'violet' };

const Tag = memo<{ label: string; tip: string; tone?: NoteTone; event?: EventCode; className?: string }>(
  ({ label, tip, tone, event, className }) => (
    <Tip label={tip}>
      <span className={clsx(classes.tag, className)} data-tone={tone} data-event={event}>
        {label}
      </span>
    </Tip>
  ),
);

export const EventTag = memo<{ event: EventCode; tip?: boolean; className?: string }>(
  ({ event, tip = true, className }) => (
    <Tag
      label={event}
      tip={tip ? EVENT_NAMES[event] : ''}
      event={event}
      className={clsx(discipline.tone, classes.eventTag, className)}
    />
  ),
);

export const NoteTag = memo<{ label: string; tip: string; tone: NoteTone }>(({ label, tip, tone }) => (
  <Tag label={label} tip={tip} tone={tone} className={classes.note} />
));

export const MatchNote = memo<{ match: Match; form?: 'short' | 'long' }>(({ match, form = 'short' }) => {
  const label = match.status === 'F' ? noteLabel(match.note, form) : '';
  return label ? <NoteTag label={label} tip={noteTip(match)} tone={NOTE_TONES[match.note ?? ''] ?? 'sky'} /> : null;
});
