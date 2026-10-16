import { useLingui } from '@lingui/react/macro';
import { memo, useCallback, useMemo, type CSSProperties } from 'react';

import { Segmented, type SegmentedOption } from '~/components/ui';
import { EVENT_OPTIONS } from '~/constants';
import type { EventCode } from '~/types';

import classes from './EventPicker.module.css';

type EventFilter = EventCode | 'all';

export const EventPicker = memo<{
  events: readonly EventCode[];
  value: EventCode | undefined;
  onChange: (event: EventCode | undefined) => void;
}>(({ events, value, onChange }) => {
  const { t } = useLingui();
  const options = useMemo(
    (): SegmentedOption<EventFilter>[] => [
      {
        value: 'all',
        label: t({ message: 'All', context: 'discipline', comment: 'Discipline filter option: show every discipline' }),
      },
      ...EVENT_OPTIONS.filter((o) => events.includes(o.value)),
    ],
    [events, t],
  );
  const select = useCallback(
    (v: EventFilter | null) => {
      if (v) onChange(v === 'all' ? undefined : v);
    },
    [onChange],
  );
  return (
    <div className={classes.picker} style={{ '--count': options.length } as CSSProperties}>
      <Segmented options={options} value={value ?? 'all'} onChange={select} />
    </div>
  );
});
