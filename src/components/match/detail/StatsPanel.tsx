import { clsx } from 'clsx'
import { memo, useCallback, useMemo, useState, type CSSProperties, type FC } from 'react'

import { TabBar, type TabItem } from '~/components/ui'
import type { Game, Team } from '~/types'

import { TeamLabel } from '../TeamPlayers'
import { percent, statRows, type SplitRow } from './utils'

import classes from './MatchDetail.module.css'
import utils from '~/styles/utils.module.css'

const TABS: readonly TabItem<string>[] = Array.from({ length: 6 }, (_, i) => ({
  value: String(i),
  label: i ? `Game ${i}` : 'Match',
}))

const StatRow: FC<{ row: SplitRow }> = ({ row: r }) => {
  const aWin = !r.neutral && r.a > r.b
  const bWin = !r.neutral && r.b > r.a
  return (
    <div className={classes.statRow} data-neutral={r.neutral || undefined}>
      <div className={classes.statValues}>
        <span className={clsx(utils.num, classes.statValue)} data-win={aWin || undefined}>
          {r.fa ?? r.a}
        </span>
        <span className={classes.statLabel}>{r.label}</span>
        <span className={clsx(utils.num, classes.statValue)} data-win={bWin || undefined}>
          {r.fb ?? r.b}
        </span>
      </div>
      <div className={classes.split}>
        <span
          className={classes.splitA}
          data-lead={(!r.neutral && r.a >= r.b) || undefined}
          style={{ '--w': r.neutral ? '50%' : percent(r.a, r.a + r.b, '50%') } as CSSProperties}
        />
        <span className={classes.splitB} data-lead={(!r.neutral && r.b >= r.a) || undefined} />
      </div>
    </div>
  )
}

export const StatsPanel = memo<{
  games: readonly Game[]
  teams: readonly [Team, Team]
}>(({ games, teams }) => {
  const [tab, setTab] = useState(0)
  const active = Math.min(tab, games.length)
  const rows = useMemo(() => statRows(games, active), [games, active])
  const items = useMemo(() => TABS.slice(0, games.length + 1), [games.length])
  const onTab = useCallback((v: string) => setTab(Number(v)), [])
  return (
    <div className={classes.stats}>
      <TabBar items={items} value={String(active)} onChange={onTab} ariaLabel="Match statistics" size="sm" />
      <div className={classes.statNames}>
        <TeamLabel players={teams[0].players} />
        <TeamLabel players={teams[1].players} />
      </div>
      {rows.map((r) => (
        <StatRow key={r.key} row={r} />
      ))}
    </div>
  )
})
