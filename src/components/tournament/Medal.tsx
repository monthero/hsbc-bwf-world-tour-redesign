import type { FC } from 'react';

import { IconMedal } from '~/components/ui';
import type { MedalKind } from '~/types';

import classes from './Medal.module.css';

export const Medal: FC<{ kind: MedalKind; size?: number | string }> = ({ kind, size = 28 }) => {
  return <IconMedal size={size} className={classes.medal} data-kind={kind} />;
};

export const MedalCount: FC<{
  kind: MedalKind;
  label: string;
  count: number;
  size?: 'sm' | 'md';
  active?: boolean;
  dimmed?: boolean;
  onClick?: () => void;
  title?: string;
}> = ({ kind, label, count, size = 'md', active, dimmed, onClick, title }) => {
  const props = {
    className: classes.count,
    'data-kind': kind,
    'data-size': size,
    'data-active': active || undefined,
    'data-dimmed': dimmed || undefined,
    'data-zero': !count || undefined,
    title,
  };
  const body = (
    <>
      {size === 'md' && (
        <span className={classes.countMedal}>
          <Medal kind={kind} size={32} />
        </span>
      )}
      <span className={classes.countText}>
        <span className={classes.countLabel}>{label}</span>
        <span className={classes.countValue}>{count}</span>
      </span>
    </>
  );
  if (!onClick) return <div {...props}>{body}</div>;
  return (
    <button type="button" {...props} disabled={!count} aria-pressed={!!active} onClick={onClick}>
      {body}
    </button>
  );
};
