import { Link } from '@tanstack/react-router'
import { clsx } from 'clsx'
import { memo } from 'react'

import { Flag } from '~/components/country'
import { LogoTile } from '~/components/tournament'
import { IconNext } from '~/components/ui'
import type { Tournament } from '~/types'
import { tournamentParams } from '~/utils/tournaments'

import { shortStatus } from '../utils'

import classes from './SelectedEvent.module.css'
import utils from '~/styles/utils.module.css'

export const SelectedEvent = memo<{ tournament: Tournament }>(({ tournament: t }) => (
  <Link
    to="/world-tour/$year/$slug"
    params={tournamentParams(t)}
    className={classes.card}
    data-status={t.status}
    aria-live="polite"
  >
    <LogoTile src={t.logo} name={t.name} size={40} flat />
    <span className={classes.text}>
      <span className={clsx(classes.title, utils.ellipsis)}>{t.title}</span>
      <span className={clsx(classes.meta, utils.num)}>
        {t.cc && <Flag cc={t.cc} size="xs" tip={false} />}
        <span className={utils.ellipsis}>
          {t.city} · {t.dates}
        </span>
      </span>
    </span>
    <span className={classes.status}>
      {shortStatus(t)}
      <IconNext size={14} />
    </span>
  </Link>
))
