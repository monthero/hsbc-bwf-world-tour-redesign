import { useLingui } from '@lingui/react/macro';
import { clsx } from 'clsx';
import { memo, type ReactNode } from 'react';

import { Tip } from '~/components/ui';
import type { MatchOutcome, PlayerMatch } from '~/types';

import { OUTCOME_LABELS, PILL_LABELS, TBD } from './labels';
import { MatchTime } from './MatchTime';

import classes from './Outcome.module.css';

type OutcomeVariant = 'badge' | 'tile' | 'dot' | 'pill';

export const OutcomeBadge = memo<{
  outcome: MatchOutcome;
  label?: ReactNode;
  variant?: OutcomeVariant;
  tip?: string;
  onClick?: () => void;
  className?: string;
}>(({ outcome, label, variant = 'badge', tip, onClick, className }) => {
  const { i18n } = useLingui();
  const props = { className: clsx(classes.badge, className), 'data-outcome': outcome, 'data-variant': variant };
  const pill = variant === 'pill' ? PILL_LABELS[outcome] : undefined;
  const text = label ?? (outcome === 'up' ? outcome : i18n._(pill ?? OUTCOME_LABELS[outcome]));
  const el = onClick ? (
    <button type="button" {...props} onClick={onClick}>
      {text}
    </button>
  ) : (
    <span {...props}>{text}</span>
  );
  return tip ? <Tip label={tip}>{el}</Tip> : el;
});

export interface FormItem {
  key: string;
  outcome: 'W' | 'L';
  tip?: string;
  onClick?: () => void;
}

export const FormStrip = memo<{
  items: readonly FormItem[];
  variant?: 'dot' | 'tile';
  align?: 'start' | 'end';
  className?: string;
}>(({ items, variant = 'dot', align = 'start', className }) => {
  return (
    <span className={clsx(classes.strip, className)} data-variant={variant} data-align={align}>
      {items.map((x) => (
        <OutcomeBadge key={x.key} outcome={x.outcome} variant={variant} tip={x.tip} onClick={x.onClick} />
      ))}
    </span>
  );
});

export const OutcomeLabel = memo<{ pm: PlayerMatch; zone?: boolean }>(({ pm, zone = false }) => {
  const { i18n } = useLingui();
  return pm.outcome === 'up' ? (
    <MatchTime match={pm.match} zone={zone} fallback={i18n._(TBD)} />
  ) : (
    i18n._(OUTCOME_LABELS[pm.outcome])
  );
});
