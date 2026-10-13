import { Checkbox } from '@mantine/core'
import { clsx } from 'clsx'
import { memo, useMemo, type Ref } from 'react'

import { Flag } from '~/components/country'
import { EventTag } from '~/components/match'
import { PlayerAvatar } from '~/components/player'
import { useWindowList } from '~/hooks/useWindowList'
import { formatDayMonthYear } from '~/utils/dates'
import { formatRank } from '~/utils/format'

import { BADGE_FIELDS, effectiveImage } from '../fields'
import type { AdminRow } from '../filters'
import { StateBadge } from './StateBadge'

import classes from './PlayerTable.module.css'
import utils from '~/styles/utils.module.css'

const ROW_ESTIMATE = 53

const PlayerRow = memo<{
  row: AdminRow
  index: number
  checked: boolean
  measure: Ref<HTMLDivElement>
  onToggle: (id: string) => void
  onOpen: (id: string) => void
}>(({ row, index, checked, measure, onToggle, onOpen }) => {
  const p = row.player
  return (
    <div ref={measure} data-index={index} data-row className={classes.row} data-checked={checked || undefined}>
      <button type="button" className={utils.hit} aria-label={`Edit ${row.name}`} onClick={() => onOpen(p.id)} />
      <Checkbox
        size="xs"
        checked={checked}
        onChange={() => onToggle(p.id)}
        aria-label={`Select ${row.name}`}
        className={clsx(utils.raise, classes.check)}
      />
      <PlayerAvatar id={p.id} name={row.name} photo={effectiveImage(p, 'photo')} size={36} className={classes.avatar} />
      <span className={classes.name}>
        <span className={utils.ellipsis}>{row.name}</span>
        <span className={clsx(utils.num, classes.id)}>{p.id}</span>
      </span>
      <span className={classes.country}>
        <Flag cc={p.cc} size="sm" tip={false} />
        {p.cc}
      </span>
      <span className={clsx(utils.num, classes.rank)}>
        {formatRank(p.rank)}
        {p.rankEvent && <EventTag event={p.rankEvent} />}
      </span>
      <span className={clsx(utils.num, classes.played)}>{formatDayMonthYear(p.lastPlayed)}</span>
      <span className={classes.badges}>
        {BADGE_FIELDS.map((f) => (
          <StateBadge key={f.key} label={f.label} state={row.states[f.key] ?? 'none'} />
        ))}
      </span>
      <span className={classes.local}>
        {row.overridden && <span className={classes.overridden}>Override</span>}
        {row.hasNotes && <span className={classes.note}>Note</span>}
      </span>
    </div>
  )
})

const Header = memo<{ all: boolean; some: boolean; onToggleAll: () => void }>(({ all, some, onToggleAll }) => (
  <div className={classes.head}>
    <Checkbox
      size="xs"
      checked={all}
      indeterminate={some && !all}
      onChange={onToggleAll}
      aria-label="Select all filtered players"
      className={classes.check}
    />
    <span />
    <span>Player</span>
    <span>Country</span>
    <span>World rank</span>
    <span>Last played</span>
    <span>Images</span>
    <span>Local</span>
  </div>
))

export const PlayerTable = memo<{
  rows: readonly AdminRow[]
  selected: ReadonlySet<string>
  onToggle: (id: string) => void
  onToggleAll: () => void
  onOpen: (id: string) => void
}>(({ rows, selected, onToggle, onToggleAll, onOpen }) => {
  const { ref, items, measure, before, after } = useWindowList<HTMLDivElement>(rows.length, ROW_ESTIMATE)
  const picked = useMemo(() => rows.filter((r) => selected.has(r.player.id)).length, [rows, selected])
  return (
    <div className={classes.table}>
      <Header all={picked === rows.length} some={picked > 0} onToggleAll={onToggleAll} />
      <div ref={ref} style={{ paddingTop: before, paddingBottom: after }}>
        {items.map((it) => {
          const r = rows[it.index]
          return (
            r && (
              <PlayerRow
                key={r.player.id}
                row={r}
                index={it.index}
                checked={selected.has(r.player.id)}
                measure={measure}
                onToggle={onToggle}
                onOpen={onOpen}
              />
            )
          )
        })}
      </div>
    </div>
  )
})
