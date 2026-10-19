import { memo } from 'react';

const FULL =
  'M0 0H134V61H0Z M0 4.6H134 M0 56.4H134 M7.6 0V61 M126.4 0V61 M47.2 0V61 M86.8 0V61 M0 30.5H47.2 M86.8 30.5H134';
const SERVICE = 'M47.2 0V61 M86.8 0V61';
const NET = 'M67 -4V65';

export const COURT_VIEWBOX = '0 0 134 61';

export const CourtLines = memo<{
  part?: 'full' | 'service';
  net?: boolean;
  lines?: boolean;
  className?: string;
  netClassName?: string;
}>(({ part = 'full', net = true, lines = true, className, netClassName }) => (
  <>
    {lines && <path d={part === 'full' ? FULL : SERVICE} className={className} />}
    {net && <path d={NET} className={netClassName} />}
  </>
));
