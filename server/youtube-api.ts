import type { Endpoint } from './endpoints.ts'
import { cdnCache, IMMUTABLE_CACHE, sendJson } from './http.ts'
import { createMediaService, mediaPhase, type MediaPhase, type MediaServiceOptions } from './youtube.ts'

const MEDIA_URL = /^\/media\/([\dA-F-]{36})$/i
const MISS_CACHE = cdnCache(300, 0)

const PHASE_CACHE: Record<MediaPhase, string> = {
  upcoming: cdnCache(600, 600, 600),
  live: cdnCache(3600, 600, 600),
  settled: IMMUTABLE_CACHE,
}

export const youtubeEndpoint = ({ key, ...options }: Omit<MediaServiceOptions, 'key'> & { key?: string }): Endpoint => {
  const service = key ? createMediaService({ key, ...options }) : null
  return {
    name: 'youtube-media',
    prefix: '/yt-api',
    serve: async (url, res) => {
      if (!service) return sendJson(res, 503, { error: 'YouTube media is not configured' })
      const code = MEDIA_URL.exec(url.pathname)?.[1]
      const event = code ? await service.eventOf(code) : null
      if (!event) return sendJson(res, 404, { error: 'Unknown tournament' }, MISS_CACHE)
      return sendJson(res, 200, await service.media(event), PHASE_CACHE[mediaPhase(event)])
    },
  }
}
