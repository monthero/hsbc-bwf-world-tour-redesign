import { clsx } from 'clsx';
import { memo } from 'react';

import { Tip } from '~/components/ui';
import { EVENT_NAMES } from '~/constants';
import type { EventCode, Match, Side } from '~/types';
import { noteLabel, noteTip, opposite, winnerSide } from '~/utils/matches';

import classes from './EventTag.module.css';
import discipline from '~/styles/discipline.module.css';

const Tag = memo<{ label: string; tip: string; note?: string; event?: EventCode; className?: string }>(
  ({ label, tip, note, event, className }) => (
    <Tip label={tip}>
      <span className={clsx(classes.tag, className)} data-note={note} data-event={event}>
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

export const NoteTag = memo<{ label: string; tip: string; note?: string; className?: string }>(
  ({ label, tip, note, className }) => (
    <Tag label={label} tip={tip} note={note} className={clsx(classes.note, className)} />
  ),
);

export const MatchNote = memo<{ match: Match; form?: 'short' | 'long' }>(({ match, form = 'short' }) => {
  const label = match.status === 'F' ? noteLabel(match.note, form) : '';
  return label ? <NoteTag label={label} tip={noteTip(match)} note={match.note ?? undefined} /> : null;
});

export const SideNote = memo<{ match: Match; side: Side; className?: string }>(({ match, side, className }) => {
  const winner = winnerSide(match);
  const label = noteLabel(match.note, 'short');
  if (winner === null || !label) return null;
  const tagged = match.note === 'Walkover' ? winner : opposite(winner);
  return tagged === side ? (
    <NoteTag label={label} tip={noteTip(match)} note={match.note ?? undefined} className={className} />
  ) : null;
});
