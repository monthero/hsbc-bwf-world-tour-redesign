import path from 'node:path'

import { vercelFunction } from '../server/endpoints.ts'
import { youtubeEndpoint } from '../server/youtube-api.ts'

export default vercelFunction(
  youtubeEndpoint({
    key: process.env.YOUTUBE_API_KEY,
    root: path.resolve(import.meta.dirname, '..'),
    persist: false,
  }),
)
