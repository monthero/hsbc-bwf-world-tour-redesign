import type { MessageDescriptor } from '@lingui/core';
import { useLingui } from '@lingui/react';
import { useMemo } from 'react';

import type { SegmentedOption } from '~/components/ui';

export interface LazyOption<T extends string> extends Omit<SegmentedOption<T>, 'label' | 'tip'> {
  label: MessageDescriptor | string;
  tip?: MessageDescriptor;
}

export const useLazyOptions = <T extends string>(options: readonly LazyOption<T>[]): SegmentedOption<T>[] => {
  const { i18n } = useLingui();
  return useMemo(
    () =>
      options.map((o) => ({
        ...o,
        label: typeof o.label === 'string' ? o.label : i18n._(o.label),
        tip: o.tip && i18n._(o.tip),
      })),
    [i18n, options],
  );
};
