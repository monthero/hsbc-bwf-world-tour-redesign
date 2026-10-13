import type { BioView, FactItem, PhotoCrop, PlayerBio, PlayerDirectory, StatItem } from '~/types'

import { ageOn, formatDayMonthYear } from './dates'
import { formatFeetInches, HEIGHT_UNIT } from './format'
import { playerSquareUrl, playerThumbUrl } from './images'
import { unshout } from './names'

const facts = (list: { key: string; label: string; value: string | undefined }[], fmt: (s: string) => string) =>
  list.flatMap((f): FactItem[] => (f.value ? [{ key: f.key, label: f.label, value: fmt(f.value) }] : []))

const keep = (s: string) => s

const sentence = (s: string) => {
  const t = unshout(s)
  return t.charAt(0).toUpperCase() + t.slice(1)
}

const socialUrl = (value: string | undefined, host: string) => {
  if (!value?.includes(host) || /\s/.test(value)) return undefined
  return /^https?:\/\//i.test(value) ? value : `https://${value}`
}

export const buildBio = (bio: PlayerBio | undefined): BioView => {
  const b = bio ?? {}
  const stats: StatItem[] = []
  if (b.born)
    stats.push({ key: 'age', label: 'Age', value: String(ageOn(b.born)), sub: `Born ${formatDayMonthYear(b.born)}` })
  else if (b.age) stats.push({ key: 'age', label: 'Age', value: String(b.age) })
  if (b.height)
    stats.push({
      key: 'height',
      label: 'Height',
      value: String(b.height),
      unit: HEIGHT_UNIT,
      inline: formatFeetInches(b.height),
    })
  if (b.plays) {
    const hand = b.plays.replace(/-handed$/i, '').split('-')[0] ?? ''
    stats.push({ key: 'hand', label: 'Playing hand', value: unshout(hand) })
  }
  const natTeam = b.natTeam?.trim()
  const details = facts(
    [
      { key: 'nickname', label: 'Nickname', value: b.nickname },
      { key: 'birthplace', label: 'Birthplace', value: b.birthplace },
      { key: 'residence', label: 'Lives in', value: b.residence },
      { key: 'languages', label: 'Languages', value: b.languages },
      { key: 'debut', label: 'Intl. debut', value: b.debut },
      {
        key: 'natTeam',
        label: 'National team',
        value: natTeam && (/^since/i.test(natTeam) ? natTeam.replace(/^since/i, 'Since') : `Since ${natTeam}`),
      },
      { key: 'coach', label: 'Coach', value: b.coach },
      { key: 'club', label: 'Club', value: b.club },
    ],
    unshout,
  )
  const equipment = facts(
    [
      { key: 'racket', label: 'Racket', value: b.racket },
      { key: 'string', label: 'String', value: b.string },
      { key: 'shoes', label: 'Shoes', value: b.shoes },
      { key: 'bag', label: 'Bag', value: b.bag },
    ],
    keep,
  )
  const notes = facts(
    [
      { key: 'achievements', label: 'Memorable achievements', value: b.achievements },
      { key: 'idol', label: 'Sporting hero', value: b.idol },
      { key: 'started', label: 'Started competing', value: b.started },
    ],
    sentence,
  )
  const links = facts(
    [
      { key: 'instagram', label: 'Instagram', value: socialUrl(b.instagram, 'instagram.com') },
      { key: 'facebook', label: 'Facebook', value: socialUrl(b.facebook, 'facebook.com') },
    ],
    keep,
  )
  return { stats, details, equipment, notes, links, prize: b.prize ?? '', ambition: b.ambition ?? '' }
}

export interface PhotoOptions {
  photo?: string | null
  size?: number
  framing?: PhotoCrop | null
}

export const playerPhoto = (
  dir: PlayerDirectory | undefined,
  id: string,
  { photo, size, framing }: PhotoOptions = {},
) => {
  const record = dir?.get(id)
  const own = photo || record?.photo
  const crop = framing === undefined ? (own === record?.photo && record?.photoCrop) || null : framing
  const thumb = playerThumbUrl(own)
  return { src: size && !crop ? playerSquareUrl(thumb, size) : thumb, crop }
}
