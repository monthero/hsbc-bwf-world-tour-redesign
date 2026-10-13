import { Link } from '@tanstack/react-router'
import { clsx } from 'clsx'
import { memo } from 'react'

import { LogoTile } from '~/components/tournament'
import { LEVEL_VARS } from '~/constants'
import type { Tournament } from '~/types'
import { tournamentParams } from '~/utils/tournaments'

import type { SeasonFocus } from '../types'
import { kickerOf, shortStatus } from '../utils'

import classes from './MapEventRow.module.css'
import utils from '~/styles/utils.module.css'

export const MapEventRow = memo<{ tournament: Tournament; focus: SeasonFocus }>(({ tournament: t, focus }) => (
  <Link
    to="/world-tour/$year/$slug"
    params={tournamentParams(t)}
    className={classes.row}
    style={LEVEL_VARS[t.level]}
    data-status={t.status}
    data-tone={t === focus.finals ? 'gold' : undefined}
  >
    <LogoTile src={t.logo} name={t.name} size={32} flat />
    <span className={classes.text}>
      <span className={classes.kicker}>{kickerOf(t, focus)}</span>
      <span className={clsx(classes.title, utils.ellipsis)}>{t.title}</span>
      <span className={clsx(classes.meta, utils.ellipsis, utils.num)}>
        {t.city} · {t.dates}
      </span>
    </span>
    <span className={classes.status}>{shortStatus(t)}</span>
  </Link>
))
