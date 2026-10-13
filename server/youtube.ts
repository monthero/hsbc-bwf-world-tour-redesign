import fs from 'node:fs/promises'
import path from 'node:path'

import { dayjs, nowIso } from '../scripts/sync/dates.ts'

const API = 'https://www.googleapis.com/youtube/v3'
const CHANNEL_ID = 'UChh-akEbUM8_6ghGVnJd6cQ'
const PAGE_SIZE = 50
const MAX_PLAYLIST_PAGES = 4
const HOUR_MS = 3_600_000
const SETTLE_DAYS = 2
const FULL_MATCH_MIN_SEC = 25 * 60
const SHORT_MAX_SEC = 180
const ROUNDS = new Set(['R64', 'R32', 'R16', 'QF', 'SF', 'F'])

export type MediaKind =
  | 'full_match'
  | 'highlights'
  | 'court_stream'
  | 'play_of_the_day'
  | 'top_shots'
  | 'short'
  | 'promo'
  | 'other'

export type MediaLive = 'none' | 'upcoming' | 'live'

export interface MediaItem {
  id: string
  title: string
  kind: MediaKind
  publishedAt: string
  durationSec: number | null
  live: MediaLive
  sides: [string[], string[]] | null
  round: string | null
  day: number | null
  court: number | null
}

export interface TournamentMedia {
  code: string
  playlistId: string | null
  fetchedAt: string
  items: MediaItem[]
}

export interface MediaEvent {
  code: string
  name: string
  title: string
  year: number
  start: string
  end: string
}

interface Page<T> {
  items: T[]
  nextPageToken?: string
}

interface Playlist {
  id: string
  snippet: { title: string }
}

interface PlaylistItem {
  contentDetails: { videoId: string }
}

interface Video {
  id: string
  snippet: { title: string; publishedAt: string; tags?: string[]; liveBroadcastContent?: string }
  contentDetails?: { duration?: string }
  liveStreamingDetails?: object
}

const fold = (s: string) =>
  s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/ø/g, 'o').replace(/æ/g, 'ae').replace(/ß/g, 'ss')

const tokens = (s: string) =>
  fold(s)
    .split(/[^a-z0-9]+/)
    .filter(Boolean)

const ytGet = async <T>(key: string, endpoint: string, params: Record<string, string>): Promise<T> => {
  const query = new URLSearchParams({ ...params, key })
  const res = await fetch(`${API}/${endpoint}?${query.toString()}`)
  if (!res.ok) throw new Error(`YouTube ${endpoint} failed (${res.status})`)
  return (await res.json()) as T
}

const allPages = async <T>(
  key: string,
  endpoint: string,
  params: Record<string, string>,
  maxPages = Infinity,
): Promise<T[]> => {
  const out: T[] = []
  let pageToken: string | undefined
  for (let page = 0; page < maxPages; page++) {
    const res = await ytGet<Page<T>>(key, endpoint, {
      ...params,
      maxResults: String(PAGE_SIZE),
      ...(pageToken ? { pageToken } : {}),
    })
    out.push(...res.items)
    pageToken = res.nextPageToken
    if (!pageToken) break
  }
  return out
}

let playlistCache: { at: number; items: Playlist[] } | null = null

const channelPlaylists = async (key: string) => {
  if (playlistCache && Date.now() - playlistCache.at < HOUR_MS) return playlistCache.items
  const items = await allPages<Playlist>(
    key,
    'playlists',
    { part: 'snippet', channelId: CHANNEL_ID },
    MAX_PLAYLIST_PAGES,
  )
  playlistCache = { at: Date.now(), items }
  return items
}

const playlistScore = (e: MediaEvent, title: string) => {
  const have = new Set(tokens(title))
  if (!have.has(String(e.year)) || !tokens(e.name).every((t) => have.has(t))) return 0
  return 1 + tokens(e.title).filter((t) => have.has(t)).length
}

const findPlaylist = async (key: string, e: MediaEvent) => {
  let best: { id: string; score: number } | null = null
  for (const p of await channelPlaylists(key)) {
    const score = playlistScore(e, p.snippet.title)
    if (score > (best?.score ?? 0)) best = { id: p.id, score }
  }
  return best?.id ?? null
}

const durationSec = (iso: string | undefined) => {
  const m = iso?.match(/^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/)
  if (!m) return null
  const [, d = '0', h = '0', min = '0', s = '0'] = m
  return ((Number(d) * 24 + Number(h)) * 60 + Number(min)) * 60 + Number(s)
}

const parts = (title: string) => title.split('|').map((p) => p.trim())

const parseSide = (side: string) =>
  side
    .replace(/\([A-Z]{3}\)/g, '')
    .replace(/\[\d+\]/g, '')
    .split('/')
    .map((n) => n.trim())
    .filter(Boolean)

const parseSides = (title: string): [string[], string[]] | null => {
  const vs = parts(title).find((p) => / vs /i.test(p))
  const [a, b] = vs?.split(/ vs /i) ?? []
  if (!a || !b) return null
  return [parseSide(a), parseSide(b)]
}

const parseRound = (title: string) => {
  const last = parts(title).at(-1) ?? ''
  return ROUNDS.has(last) ? last : null
}

const courtStream = (title: string) => title.match(/\|\s*Day (\d+)\s*\|\s*Court (\d+)/i)

const classify = (v: Video, sec: number | null): MediaKind => {
  const { title, tags = [] } = v.snippet
  if (tags.includes('b_highlights')) return 'highlights'
  if (tags.includes('b_play_of_the_day') || /play of the day/i.test(title)) return 'play_of_the_day'
  if (tags.includes('b_top') || /top \w+ of the week/i.test(title)) return 'top_shots'
  if (courtStream(title)) return 'court_stream'
  if (/\|\s*\d{1,2}\s*-\s*\d{1,2}\s+[a-z]+$/i.test(title)) return 'promo'
  if (/ vs /i.test(title)) {
    const full = !!v.liveStreamingDetails || (sec ?? 0) > FULL_MATCH_MIN_SEC || !!parseRound(title)
    return full ? 'full_match' : 'highlights'
  }
  if (sec !== null && sec <= SHORT_MAX_SEC) return 'short'
  return 'other'
}

const liveOf = (v: Video): MediaLive => {
  const s = v.snippet.liveBroadcastContent
  return s === 'live' || s === 'upcoming' ? s : 'none'
}

const toItem = (v: Video): MediaItem => {
  const sec = durationSec(v.contentDetails?.duration)
  const kind = classify(v, sec)
  const court = courtStream(v.snippet.title)
  const withSides = kind === 'full_match' || kind === 'highlights'
  return {
    id: v.id,
    title: v.snippet.title,
    kind,
    publishedAt: v.snippet.publishedAt,
    durationSec: sec,
    live: liveOf(v),
    sides: withSides ? parseSides(v.snippet.title) : null,
    round: withSides ? parseRound(v.snippet.title) : null,
    day: court ? Number(court[1]) : null,
    court: court ? Number(court[2]) : null,
  }
}

const videosOf = async (key: string, ids: string[]) => {
  const out: Video[] = []
  for (let i = 0; i < ids.length; i += PAGE_SIZE) {
    const res = await ytGet<Page<Video>>(key, 'videos', {
      part: 'snippet,contentDetails,liveStreamingDetails',
      id: ids.slice(i, i + PAGE_SIZE).join(','),
    })
    out.push(...res.items)
  }
  return out
}

export const fetchTournamentMedia = async (key: string, e: MediaEvent): Promise<TournamentMedia> => {
  const playlistId = await findPlaylist(key, e)
  const entries = playlistId
    ? await allPages<PlaylistItem>(key, 'playlistItems', { part: 'contentDetails', playlistId })
    : []
  const videos = await videosOf(
    key,
    entries.map((x) => x.contentDetails.videoId),
  )
  return {
    code: e.code,
    playlistId,
    fetchedAt: nowIso(),
    items: videos.map(toItem).toSorted((a, b) => b.publishedAt.localeCompare(a.publishedAt)),
  }
}

export type MediaPhase = 'upcoming' | 'live' | 'settled'

export const mediaPhase = (e: MediaEvent, now = dayjs()): MediaPhase => {
  if (now.isBefore(dayjs.utc(e.start))) return 'upcoming'
  return now.isAfter(dayjs.utc(e.end).add(SETTLE_DAYS + 1, 'day')) ? 'settled' : 'live'
}

const emptyMedia = (code: string): TournamentMedia => ({
  code,
  playlistId: null,
  fetchedAt: nowIso(),
  items: [],
})

const readJson = async <T>(file: string): Promise<T | null> => {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8')) as T
  } catch {
    return null
  }
}

export const createMediaService = ({ key, root }: { key: string; root: string }) => {
  const settledDir = path.join(root, 'data/media')
  const calendarFile = path.join(root, 'public/data/calendar-2026.json')
  const liveCache = new Map<string, { at: number; media: TournamentMedia }>()

  const eventOf = async (code: string) =>
    (await readJson<{ events: MediaEvent[] }>(calendarFile))?.events.find((e) => e.code === code) ?? null

  const settled = async (e: MediaEvent) => {
    const file = path.join(settledDir, `${e.code}.json`)
    const cached = await readJson<TournamentMedia>(file)
    if (cached) return cached
    const media = await fetchTournamentMedia(key, e)
    await fs.mkdir(settledDir, { recursive: true })
    await fs.writeFile(file, JSON.stringify(media))
    return media
  }

  const live = async (e: MediaEvent) => {
    const hit = liveCache.get(e.code)
    if (hit && Date.now() - hit.at < HOUR_MS) return hit.media
    const media = await fetchTournamentMedia(key, e)
    liveCache.set(e.code, { at: Date.now(), media })
    return media
  }

  return {
    eventOf,
    media: async (e: MediaEvent) => {
      const phase = mediaPhase(e)
      if (phase === 'upcoming') return emptyMedia(e.code)
      return phase === 'settled' ? settled(e) : live(e)
    },
  }
}
