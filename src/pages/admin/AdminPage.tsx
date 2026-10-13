import { clsx } from 'clsx'
import type { FC } from 'react'

import { useDocumentTitle } from '~/hooks/useDocumentTitle'

import { PlayersTab } from './components/PlayersTab'

import classes from './AdminPage.module.css'
import utils from '~/styles/utils.module.css'

const Console: FC = () => (
  <div className={classes.page}>
    <header className={clsx(utils.container, classes.header)}>
      <span className={classes.kicker}>Local overrides</span>
      <h1 className={classes.title}>Admin</h1>
      <p className={classes.meta}>Saves write data/overrides.json and re-export public/data.</p>
    </header>
    <PlayersTab />
  </div>
)

export const AdminPage: FC = () => {
  useDocumentTitle('Admin', 'bwf')
  return <Console />
}
