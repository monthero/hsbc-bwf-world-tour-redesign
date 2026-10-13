import { clsx } from 'clsx'
import type { FC } from 'react'

import { countryName } from '~/utils/countries'

import { Flag, type FlagSize } from './Flag'

import classes from './CountryLabel.module.css'

export const CountryLabel: FC<{ cc: string; flagSize?: FlagSize; className?: string }> = ({
  cc,
  flagSize,
  className,
}) => {
  return (
    <span className={clsx(classes.country, className)}>
      <Flag cc={cc} size={flagSize} tip={false} />
      {countryName(cc)}
    </span>
  )
}
