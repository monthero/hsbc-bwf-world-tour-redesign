import { Link } from '@tanstack/react-router'
import { clsx } from 'clsx'
import type { FC } from 'react'

import { localAsset } from '~/utils/images'

import classes from './Wordmark.module.css'

const LOGO = localAsset('/assets/brand/logo-wt-white.svg')

export const Wordmark: FC<{ onNavigate?: () => void; className?: string }> = ({ onNavigate, className }) => (
  <Link
    to="/"
    className={clsx(classes.wordmark, className)}
    onClick={onNavigate}
    aria-label="HSBC BWF World Tour concept, home"
  >
    <img src={LOGO} alt="" className={classes.logo} width={151} height={46} />
    <span className={classes.tag}>Concept</span>
  </Link>
)
