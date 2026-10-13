import { Tooltip } from '@mantine/core'
import { clsx } from 'clsx'
import { memo, type ReactNode } from 'react'

import type { MatchOutcome } from '~/types'

import classes from './Outcome.module.css'

export type OutcomeVariant = 'badge' | 'tile' | 'dot' | 'pill'

const PILL_LABELS: Partial<Record<MatchOutcome, string>> = { W: 'WON', L: 'LOST' }

export const OutcomeBadge = memo<{
  outcome: MatchOutcome
  label?: ReactNode
  variant?: OutcomeVariant
  tip?: string
  onClick?: () => void
  className?: string
}>(({ outcome, label, variant = 'badge', tip, onClick, className }) => {
  const props = { className: clsx(classes.badge, className), 'data-outcome': outcome, 'data-variant': variant }
  const text = label ?? (variant === 'pill' ? (PILL_LABELS[outcome] ?? outcome) : outcome)
  const el = onClick ? (
    <button type="button" {...props} onClick={onClick}>
      {text}
    </button>
  ) : (
    <span {...props}>{text}</span>
  )
  return tip ? <Tooltip label={tip}>{el}</Tooltip> : el
})

export interface FormItem {
  key: string
  outcome: 'W' | 'L'
  tip?: string
  onClick?: () => void
}

export const FormStrip = memo<{
  items: readonly FormItem[]
  variant?: 'dot' | 'tile'
  align?: 'start' | 'end'
  className?: string
}>(({ items, variant = 'dot', align = 'start', className }) => {
  return (
    <span className={clsx(classes.strip, className)} data-variant={variant} data-align={align}>
      {items.map((x) => (
        <OutcomeBadge key={x.key} outcome={x.outcome} variant={variant} tip={x.tip} onClick={x.onClick} />
      ))}
    </span>
  )
})
