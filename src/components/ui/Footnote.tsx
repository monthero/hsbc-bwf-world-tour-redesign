import { Tooltip } from '@mantine/core'
import type { FC } from 'react'

import classes from './Footnote.module.css'

const EVENTS = { hover: true, focus: true, touch: true }

export const Footnote: FC<{ note: string }> = ({ note }) => (
  <Tooltip label={note} events={EVENTS}>
    <button type="button" className={classes.mark} aria-label={note}>
      *
    </button>
  </Tooltip>
)
