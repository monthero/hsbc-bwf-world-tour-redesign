import { memo, useCallback, useMemo, type CSSProperties } from 'react';

import { Segmented, type SegmentedOption } from '~/components/ui';
import { EVENT_OPTIONS } from '~/constants';
import type { EventCode } from '~/types';

import classes from './EventPicker.module.css';

type EventFilter = EventCode | 'all';

const ALL_OPTION: SegmentedOption<EventFilter> = { value: 'all', label: 'All' };

export const EventPicker = memo<{
  events: readonly EventCode[];
  value: EventCode | undefined;
  onChange: (event: EventCode | undefined) => void;
}>(({ events, value, onChange }) => {
  const options = useMemo(
    (): SegmentedOption<EventFilter>[] => [ALL_OPTION, ...EVENT_OPTIONS.filter((o) => events.includes(o.value))],
    [events],
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
