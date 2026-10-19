import { clsx } from 'clsx';
import type { FC } from 'react';

import utils from '~/styles/utils.module.css';

export const CardHit: FC<{ label: string; onClick: () => void; className?: string }> = ({
  label,
  onClick,
  className,
}) => {
  return <button type="button" className={clsx(utils.hit, className)} aria-label={label} onClick={onClick} />;
};
