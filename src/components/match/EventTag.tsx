import { Tooltip } from '@mantine/core'
import { clsx } from 'clsx'
import { memo } from 'react'

import { TIP_DELAY, useLazyTip } from '~/components/ui'
import { EVENT_NAMES } from '~/constants'
import type { EventCode } from '~/types'

import classes from './EventTag.module.css'

export const EventTag = memo<{ event: EventCode; className?: string }>(({ event, className }) => {
  const lazy = useLazyTip<HTMLSpanElement>(true)
  return (
    <>
      <span className={clsx(classes.eventTag, className)} data-tip onPointerEnter={lazy.arm}>
        {event}
      </span>
      {lazy.target && <Tooltip target={lazy.target} label={EVENT_NAMES[event]} openDelay={TIP_DELAY.open} />}
    </>
  )
})
