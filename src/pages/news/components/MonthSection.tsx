import { Button, Skeleton } from '@mantine/core'
import { memo, useCallback } from 'react'

import { NewsGrid } from '~/components/news'
import { EmptyState } from '~/components/ui'

import { SKELETON_COUNT } from '../constants'
import type { MonthGroup, RegisterSection } from '../types'

import classes from './MonthSection.module.css'

const storiesLabel = (n: number) => (n === 1 ? '1 story' : `${n} stories`)

export const MonthSection = memo<{
  group: MonthGroup
  current: boolean
  isMobile: boolean
  register: RegisterSection
  onRetry: () => void
}>(({ group, current, isMobile, register, onRetry }) => {
  const ref = useCallback((el: HTMLElement | null) => register(group.id, el), [register, group.id])
  const variant = isMobile ? 'row' : 'card'
  const { stories, failed } = group
  return (
    <section ref={ref} className={classes.section} aria-busy={(!stories && !failed) || undefined}>
      <div className={classes.head}>
        <h2 className={classes.name}>
          {group.name} <span>{group.year}</span>
        </h2>
        {current && <span className={classes.badge}>This month</span>}
        <span className={classes.count}>
          {!stories && !failed && <Skeleton height={12} width={64} radius={6} />}
          {stories && storiesLabel(stories.length)}
        </span>
      </div>
      {failed ? (
        <EmptyState className={classes.failed}>
          {`Couldn’t load ${group.name} ${group.year}.`}
          <Button variant="default" radius="xl" size="xs" onClick={onRetry}>
            Try again
          </Button>
        </EmptyState>
      ) : (
        <NewsGrid
          stories={stories}
          variant={variant}
          skeletons={isMobile ? SKELETON_COUNT.rows : SKELETON_COUNT.grid}
        />
      )}
    </section>
  )
})
