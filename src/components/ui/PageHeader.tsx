import { clsx } from 'clsx'
import type { FC, ReactNode } from 'react'

import classes from './PageHeader.module.css'
import utils from '~/styles/utils.module.css'

export const PageHeader: FC<{
  kicker: ReactNode
  title: ReactNode
  meta?: ReactNode
  aside?: ReactNode
  children?: ReactNode
  className?: string
}> = ({ kicker, title, meta, aside, children, className }) => {
  return (
    <header className={clsx(utils.container, classes.header, className)}>
      <div className={classes.titles}>
        <span className={classes.kicker}>{kicker}</span>
        <h1 className={classes.title}>{title}</h1>
        {meta && <p className={classes.meta}>{meta}</p>}
        {children}
      </div>
      {aside}
    </header>
  )
}
