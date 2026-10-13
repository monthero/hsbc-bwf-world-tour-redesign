import type { ServerResponse } from 'node:http'

import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import Icons from 'unplugin-icons/vite'
import { defineConfig, loadEnv, type Connect, type Plugin } from 'vite'

import { adminApi } from './server/admin.ts'
import { sendJson } from './server/http.ts'
import { newsApi } from './server/news-api.ts'
import { createMediaService, mediaPhase } from './server/youtube.ts'

const BWF_API = 'https://extranet-lv.bwfbadminton.com/api'
const BWF_UA = 'Mozilla/5.0 (compatible; bwf-tracker-dev/0.1)'

const proxyBwf = async (url: string, res: ServerResponse) => {
  const upstream = await fetch(`${BWF_API}${url}`, { headers: { 'user-agent': BWF_UA, accept: 'application/json' } })
  res.statusCode = upstream.status
  res.setHeader('content-type', upstream.headers.get('content-type') ?? 'application/json')
  res.setHeader('cache-control', upstream.headers.get('cache-control') ?? 'no-store')
  res.end(Buffer.from(await upstream.arrayBuffer()))
}

const forwardToBwf: Connect.NextHandleFunction = (req, res, next) => {
  if (req.method !== 'GET') {
    res.statusCode = 405
    res.end()
    return
  }
  proxyBwf(req.url ?? '', res).catch(next)
}

const bwfApi = (): Plugin => ({
  name: 'bwf-api',
  configureServer: (server) => {
    server.middlewares.use('/bwf-api', forwardToBwf)
  },
  configurePreviewServer: (server) => {
    server.middlewares.use('/bwf-api', forwardToBwf)
  },
})

const YT_MEDIA = /^\/media\/([0-9A-F-]{36})$/i

const youtubeMedia = (key: string | undefined): Plugin => {
  const service = key ? createMediaService({ key, root: import.meta.dirname }) : null
  const serve = async (url: string, res: ServerResponse) => {
    const code = url.match(YT_MEDIA)?.[1]
    const event = code && service ? await service.eventOf(code) : null
    if (!service) return sendJson(res, 503, { error: 'YOUTUBE_API_KEY is not set' })
    if (!event) return sendJson(res, 404, { error: 'Unknown tournament' })
    const cache = mediaPhase(event) === 'settled' ? 'public, max-age=31536000, immutable' : 'public, max-age=600'
    return sendJson(res, 200, await service.media(event), cache)
  }
  const handler: Connect.NextHandleFunction = (req, res, next) => {
    if (req.method !== 'GET') return next()
    serve(req.url ?? '', res).catch(next)
  }
  return {
    name: 'youtube-media',
    configureServer: (server) => {
      server.middlewares.use('/yt-api', handler)
    },
    configurePreviewServer: (server) => {
      server.middlewares.use('/yt-api', handler)
    },
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react(),
    Icons({ compiler: 'jsx', jsx: 'react', scale: 1 }),
    bwfApi(),
    youtubeMedia(loadEnv(mode, import.meta.dirname, '').YOUTUBE_API_KEY),
    newsApi(import.meta.dirname),
    adminApi(import.meta.dirname),
  ],
  resolve: { tsconfigPaths: true },
}))
