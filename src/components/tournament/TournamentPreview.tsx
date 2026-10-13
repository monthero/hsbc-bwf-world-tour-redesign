import { HoverCard } from '@mantine/core'
import type { FC, ReactElement } from 'react'

import { IconBack } from '~/components/ui'
import type { Tournament } from '~/types'
import { hasWinners } from '~/utils/tournaments'

import { TournamentCard } from './TournamentCard'
import { WinnersHoverCard } from './Winners'

import classes from './TournamentPreview.module.css'

const WINNERS_HINT = (
  <span className={classes.hint}>
    <IconBack size={14} />
    Winners
  </span>
)

export const TournamentHoverCard: FC<{
  tournament: Tournament | undefined
  kicker?: string
  children: ReactElement
}> = ({ tournament, kicker, children }) => {
  if (!tournament) return children
  return (
    <HoverCard width={300} openDelay={150} closeDelay={150} position="bottom-end" shadow="none">
      <HoverCard.Target>{children}</HoverCard.Target>
      <HoverCard.Dropdown className={classes.dropdown} visibleFrom="sm">
        <WinnersHoverCard tournament={tournament} position="left-start" nested>
          <div>
            <TournamentCard
              tournament={tournament}
              kicker={kicker}
              status={hasWinners(tournament) ? WINNERS_HINT : undefined}
              className={classes.card}
            />
          </div>
        </WinnersHoverCard>
      </HoverCard.Dropdown>
    </HoverCard>
  )
}
