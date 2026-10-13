import { Button, Switch } from '@mantine/core'
import { memo, useCallback, type ChangeEvent, type ReactNode } from 'react'

import classes from './FramingControls.module.css'

export const FramingControls = memo<{
  title: string
  readout: string
  flip: boolean
  flipBlocked?: string
  busy: boolean
  resettable: boolean
  status?: ReactNode
  children?: ReactNode
  onFlip: (flip: boolean) => void
  onReset: () => void
}>(({ title, readout, flip, flipBlocked, busy, resettable, status, children, onFlip, onReset }) => {
  const onSwitch = useCallback((e: ChangeEvent<HTMLInputElement>) => onFlip(e.currentTarget.checked), [onFlip])
  return (
    <div className={classes.controls}>
      <span className={classes.title}>{title}</span>
      <span className={classes.readout}>{readout}</span>
      {children}
      <Switch
        checked={flip}
        disabled={busy || !!flipBlocked}
        onChange={onSwitch}
        label="Flip horizontally"
        description={flipBlocked}
      />
      <Button size="xs" radius="xl" variant="default" disabled={busy || !resettable} onClick={onReset}>
        Reset
      </Button>
      {status}
    </div>
  )
})
