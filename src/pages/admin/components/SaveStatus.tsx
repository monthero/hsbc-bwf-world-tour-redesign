import { Loader } from '@mantine/core'
import { clsx } from 'clsx'
import type { FC } from 'react'

import classes from './SaveStatus.module.css'

export const SaveStatus: FC<{ pending: boolean; error: Error | null; done?: string; hint?: string }> = ({
  pending,
  error,
  done,
  hint,
}) => {
  if (pending)
    return (
      <span className={classes.status}>
        <Loader size={14} color="var(--bwf-red)" />
        Saving and exporting…
      </span>
    )
  if (error) return <span className={clsx(classes.status, classes.error)}>{error.message}</span>
  if (hint) return <span className={classes.status}>{hint}</span>
  if (done) return <span className={clsx(classes.status, classes.ok)}>{done}</span>
  return null
}
