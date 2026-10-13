import type { Continent } from '~/types'

import data from './countries.json'

const COUNTRIES: Record<string, { iso: string; name: string; region: string }> = data

const LOCAL_FLAGS: Record<string, string> = { TPE: '/assets/flag-tpe.png', AIN: '/assets/flag-neutral.svg' }

const NAME_TO_IOC = Object.fromEntries(Object.entries(COUNTRIES).map(([ioc, c]) => [c.name, ioc]))

export const flagUrl = (ioc: string) => LOCAL_FLAGS[ioc] ?? `https://flagcdn.com/w40/${COUNTRIES[ioc]?.iso ?? 'un'}.png`

export const countryCode = (name: string) => NAME_TO_IOC[name] ?? ''

export const countryName = (ioc: string) => COUNTRIES[ioc]?.name ?? ioc

export const continentOf = (ioc: string): Continent => (COUNTRIES[ioc]?.region as Continent | undefined) ?? 'Other'
