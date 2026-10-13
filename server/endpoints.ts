import type { IncomingMessage, ServerResponse } from 'node:http'

import type { Connect, Plugin } from 'vite'

import { sendJson } from './http.ts'

export interface Endpoint {
  name: string
  prefix: string
  serve: (url: URL, res: ServerResponse) => Promise<void>
}

const LOCAL = 'http://local'

const relativeUrl = (prefix: string, url = '/') =>
  new URL(url.startsWith(prefix) ? url.slice(prefix.length) || '/' : url, LOCAL)

const rejectMethod = (req: IncomingMessage, res: ServerResponse) => {
  if (req.method === 'GET') return false
  sendJson(res, 405, { error: 'Method not allowed' })
  return true
}

export const vitePlugin = ({ name, prefix, serve }: Endpoint): Plugin => {
  const handler: Connect.NextHandleFunction = (req, res, next) => {
    if (rejectMethod(req, res)) return
    serve(new URL(req.url ?? '/', LOCAL), res).catch(next)
  }
  return {
    name,
    configureServer: (server) => {
      server.middlewares.use(prefix, handler)
    },
    configurePreviewServer: (server) => {
      server.middlewares.use(prefix, handler)
    },
  }
}

export const vercelFunction =
  ({ prefix, serve }: Endpoint) =>
  async (req: IncomingMessage, res: ServerResponse) => {
    if (rejectMethod(req, res)) return
    try {
      await serve(relativeUrl(prefix, req.url), res)
    } catch (e) {
      console.error(e)
      if (!res.headersSent) sendJson(res, 502, { error: 'Upstream request failed' })
    }
  }
