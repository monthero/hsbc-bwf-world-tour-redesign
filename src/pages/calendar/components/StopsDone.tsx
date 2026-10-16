import { Plural, Trans } from '@lingui/react/macro';
import { memo } from 'react';

export const StopsDone = memo<{ done: number; total: number; className?: string }>(({ done, total, className }) => (
  <Trans comment="Season progress in the calendar header: {done} tournaments (“stops”) played out of {total} on the World Tour this season">
    <span className={className}>{done}</span> of <Plural value={total} one="# stop" other="# stops" />
  </Trans>
));
