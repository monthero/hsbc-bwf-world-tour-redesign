import type { NewsArticle, NewsBlock, NewsImage, NewsItem, NewsLink, NewsRun } from '../src/api/schemas.ts'
import { linkMatchedPlayers, playerMatcher, type PlayerName } from './news-players.ts'
import type { RawNews } from './news.ts'

interface Element {
  name: string
  attrs: Record<string, string>
  children: Node[]
}

type Node = Element | string

export interface BlockContext {
  tournamentOf: (tmtId: number) => string | undefined
  newsOf: (slug: string) => string | undefined
}

const VOID = new Set(['img', 'br', 'hr', 'input', 'source', 'meta', 'link', 'wbr', 'col'])
const DROP = new Set(['script', 'style', 'noscript', 'svg', 'form', 'button', 'input', 'select', 'textarea', 'object'])
const INLINE = new Set([
  'a',
  'strong',
  'b',
  'em',
  'i',
  'span',
  'u',
  'sup',
  'sub',
  'br',
  'small',
  'mark',
  'font',
  'abbr',
])
const BOLD = new Set(['strong', 'b'])
const ITALIC = new Set(['em', 'i'])
const SOCIAL = /instagram-media|twitter-tweet|tiktok-embed|fb-post/
const SOCIAL_URL = /^https?:\/\/(?:www\.)?(?:twitter\.com|x\.com|instagram\.com|facebook\.com|fb\.watch|tiktok\.com)\//
const YOUTUBE = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/
const URL_LINE = /^\s*(https?:\/\/[^\s<]+)\s*$/
const PLAYER = /\/player\/(\d+)(?:\/|$)/
const TOURNAMENT = /\/tournament\/(\d+)(?:\/[^/]+\/([a-z]+)(?:\/(\d{4}-\d{2}-\d{2}))?)?(?:\/|$)/
const SECTION_TAB = { draws: 'draw', results: 'matches', live: 'matches', players: 'players' } as const
const NEWS = /\/news-single\/\d{4}\/\d{2}\/\d{2}\/([^/?#]+)/
const BWF_HOST = /(?:^|\.)bwfbadminton\.com$|(?:^|\.)bwf\.sport$/
const UPLOAD =
  /\/wp-content\/uploads\/(?:\d{4}\/\d{2}\/)?([^/]+?)(?:-scaled|-e\d{9,}|-(\d+)x\d+)*\.(jpe?g|png|gif|webp)$/i
const MIN_WIDTH = 300
const CLOUDINARY = /res\.cloudinary\.com\/badminton\/.*\/v(\d+)\/(.+?)(?:\/[^/]+)?\.(\w+)$/
const OPEN_QUOTE = /^["“‘']/
const QUOTE_END = /[”"’']\s*(?:[-–—]|,)?\s*/
const HEADING_MAX = 70
const QUOTE_SPLIT = /^(["“‘'][\s\S]*[”"’'])\s*[-–—]+\s*([\s\S]+)$/
const ENTITIES: Record<string, string> = {
  amp: '&',
  quot: '"',
  apos: "'",
  lt: '<',
  gt: '>',
  nbsp: ' ',
  ndash: '–',
  mdash: '—',
  hellip: '…',
  rsquo: '’',
  lsquo: '‘',
  rdquo: '”',
  ldquo: '“',
}

const decode = (s: string) =>
  s
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) => String.fromCodePoint(Number.parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n: string) => ENTITIES[n.toLowerCase()] ?? m)

const ATTR = /([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g
const TOKEN = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][\w-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g

const attrsOf = (s: string) =>
  Object.fromEntries([...s.matchAll(ATTR)].map((m) => [m[1]?.toLowerCase() ?? '', decode(m[2] ?? m[3] ?? m[4] ?? '')]))

const parse = (html: string): Element => {
  const root: Element = { name: '#root', attrs: {}, children: [] }
  const stack: Element[] = [root]
  const top = () => stack.at(-1) ?? root
  let last = 0
  for (const m of html.matchAll(TOKEN)) {
    if (m.index > last) top().children.push(html.slice(last, m.index))
    last = m.index + m[0].length
    const name = m[2]?.toLowerCase()
    if (!name) continue
    if (m[1]) {
      const at = stack.findLastIndex((e) => e.name === name)
      if (at > 0) stack.length = at
      continue
    }
    const el: Element = { name, attrs: attrsOf(m[3] ?? ''), children: [] }
    top().children.push(el)
    if (!VOID.has(name) && !m[3]?.trimEnd().endsWith('/')) stack.push(el)
  }
  if (last < html.length) top().children.push(html.slice(last))
  return root
}

const prepare = (raw: string) =>
  raw
    .replace(/\r\n?/g, '\n')
    .replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, '')
    .replace(/\[caption[^\]]*\]([\s\S]*?)\[\/caption\]/g, '<figure>$1</figure>')
    .replace(/\[embed[^\]]*\]([\s\S]*?)\[\/embed\]/g, '\n\n$1\n\n')
    .replace(/\[\/?(?:audio|video|gallery|playlist)[^\]]*\]/g, '')

const textOf = (n: Node): string => (typeof n === 'string' ? decode(n) : n.children.map(textOf).join(''))

const imageFrom = (src: string | undefined, caption: string | null): NewsImage | null => {
  if (!src) return null
  const c = src.match(CLOUDINARY)
  if (c?.[1] && c[2] && c[3]) return { id: c[2], v: Number(c[1]), ext: c[3], caption }
  const u = src.match(UPLOAD)
  if (!u?.[1] || !u[3] || (u[2] && Number(u[2]) < MIN_WIDTH)) return null
  return { id: `wordpress_assets_test/${decodeURIComponent(u[1])}`, v: 1, ext: u[3].toLowerCase(), caption }
}

const findAll = (n: Node, name: string): Element[] =>
  typeof n === 'string' ? [] : [...(n.name === name ? [n] : []), ...n.children.flatMap((c) => findAll(c, name))]

const sameRun = (a: NewsRun, b: NewsRun) =>
  !!a.bold === !!b.bold && !!a.italic === !!b.italic && JSON.stringify(a.link) === JSON.stringify(b.link)

const GLUED_LEFT = /[\p{L}\p{N}.,:;!?)”’]$/u
const GLUED_RIGHT = /^[\p{L}\p{N}(“]/u

const sameLink = (a: NewsRun, b: NewsRun) => JSON.stringify(a.link) === JSON.stringify(b.link)

const tidy = (runs: NewsRun[]) => {
  const merged: NewsRun[] = []
  for (const r of runs) {
    const prev = merged.at(-1)
    if (prev && sameRun(prev, r)) prev.text += r.text
    else merged.push({ ...r })
  }
  const out: NewsRun[] = []
  for (const r of merged) {
    const prev = out.at(-1)
    let text = r.text.replace(/\s+/g, ' ')
    if (!prev) text = text.trimStart()
    else if (prev.text.endsWith(' ')) text = text.replace(/^ /, '')
    else if (!sameLink(prev, r) && GLUED_LEFT.test(prev.text) && GLUED_RIGHT.test(text)) {
      if (r.link) prev.text += ' '
      else text = ` ${text}`
    }
    if (text) out.push({ ...r, text })
  }
  while (out.length) {
    const last = out.at(-1)
    if (!last) break
    last.text = last.text.trimEnd()
    if (last.text) break
    out.pop()
  }
  return out
}

const plain = (runs: NewsRun[]) => runs.map((r) => r.text).join('')

const toQuote = (runs: NewsRun[]): NewsBlock => {
  const text = plain(runs).trim()
  const m = text.match(QUOTE_SPLIT)
  if (!m?.[1] || !m[2]) return { type: 'quote', runs: [{ text }], cite: null }
  return { type: 'quote', runs: [{ text: m[1] }], cite: m[2].trim() }
}

const isQuote = (runs: NewsRun[]) => OPEN_QUOTE.test(plain(runs)) && QUOTE_END.test(plain(runs).slice(1))

export const createBlockConverter = (ctx: BlockContext) => {
  let featured: string | null = null
  const linkOf = (href: string | undefined): NewsLink | undefined => {
    if (!href) return undefined
    let url: URL
    try {
      url = new URL(decode(href).trim())
    } catch {
      return undefined
    }
    if (url.protocol !== 'https:' && url.protocol !== 'http:' && url.protocol !== 'mailto:') return undefined
    if (BWF_HOST.test(url.hostname)) {
      const player = url.pathname.match(PLAYER)?.[1]
      if (player) return { kind: 'player', id: player }
      const [, tmt, section, date] = url.pathname.match(TOURNAMENT) ?? []
      const code = tmt ? ctx.tournamentOf(Number(tmt)) : undefined
      if (code) {
        const tab = section && section in SECTION_TAB ? SECTION_TAB[section as keyof typeof SECTION_TAB] : undefined
        return { kind: 'tournament', code, ...(tab && { tab }), ...(tab === 'matches' && date && { date }) }
      }
      const slug = url.pathname.match(NEWS)?.[1]
      const id = slug ? ctx.newsOf(decodeURIComponent(slug)) : undefined
      if (id) return { kind: 'news', id }
    }
    return { kind: 'external', href: url.toString() }
  }

  const inline = (nodes: Node[], style: Omit<NewsRun, 'text'> = {}): NewsRun[] =>
    nodes.flatMap((n): NewsRun[] => {
      if (typeof n === 'string') return [{ text: decode(n), ...style }]
      if (DROP.has(n.name) || n.name === 'img' || n.name === 'iframe') return []
      if (n.name === 'br') return [{ text: ' ', ...style }]
      const next = { ...style }
      if (BOLD.has(n.name)) next.bold = true
      if (ITALIC.has(n.name)) next.italic = true
      if (n.name === 'a') {
        const link = linkOf(n.attrs.href)
        if (link) next.link = link
      }
      return inline(n.children, next)
    })

  const imageBlocks = (n: Node, caption: string | null): NewsBlock[] =>
    findAll(n, 'img')
      .map((img) => imageFrom(img.attrs.src, caption))
      .filter((i) => i !== null && i.id !== featured)
      .map((image) => ({ type: 'image', image }) as NewsBlock)

  const videoOf = (src: string | undefined, title: string | null): NewsBlock[] => {
    const id = src?.match(YOUTUBE)?.[1]
    return id ? [{ type: 'video', id, title }] : []
  }

  const paragraph = (runs: NewsRun[]): NewsBlock[] => {
    const clean = tidy(runs)
    if (!clean.length) return []
    const text = plain(clean)
    if (clean.every((r) => r.bold && !r.link) && text.length <= HEADING_MAX && !/[.!?]$/.test(text))
      return [{ type: 'heading', level: 3, runs: clean.map(({ text: t }) => ({ text: t })) }]
    if (isQuote(clean) && QUOTE_SPLIT.test(text) && clean.every((r) => !r.link)) return [toQuote(clean)]
    return [{ type: 'paragraph', runs: clean }]
  }

  const textBlocks = (text: string): NewsBlock[] =>
    text.split(/\n{2,}/).flatMap((chunk): NewsBlock[] => {
      const url = chunk.match(URL_LINE)?.[1]
      if (url) return SOCIAL_URL.test(url) ? [] : videoOf(url, null)
      return paragraph([{ text: decode(chunk) }])
    })

  const blocks = (nodes: Node[]): NewsBlock[] => {
    const out: NewsBlock[] = []
    let pending: Node[] = []
    const flush = () => {
      if (!pending.length) return
      const runs = pending
      pending = []
      const segments: Node[][] = [[]]
      for (const n of runs) {
        if (typeof n !== 'string') {
          segments.at(-1)?.push(n)
          continue
        }
        const parts = n.split(/\n{2,}/)
        parts.forEach((p, i) => {
          if (i > 0) segments.push([])
          segments.at(-1)?.push(p)
        })
      }
      for (const seg of segments) {
        const text = seg.map((s) => (typeof s === 'string' ? s : '')).join('')
        const url = seg.every((s) => typeof s === 'string') ? text.match(URL_LINE)?.[1] : undefined
        if (url) out.push(...(SOCIAL_URL.test(url) ? [] : videoOf(url, null)))
        else out.push(...paragraph(inline(seg)))
      }
    }
    for (const n of nodes) {
      if (typeof n === 'string' || INLINE.has(n.name)) {
        pending.push(n)
        continue
      }
      flush()
      out.push(...block(n))
    }
    flush()
    return out
  }

  const block = (n: Element): NewsBlock[] => {
    if (DROP.has(n.name)) return []
    switch (n.name) {
      case 'p': {
        const media = [
          ...imageBlocks(n, null),
          ...findAll(n, 'iframe').flatMap((f) => videoOf(f.attrs.src, f.attrs.title ?? null)),
        ]
        const rest = blocks(
          n.children.filter((c) => typeof c === 'string' || (c.name !== 'img' && c.name !== 'iframe')),
        )
        return [...media, ...rest]
      }
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6': {
        const runs = tidy(inline(n.children))
        if (!runs.length) return []
        if (isQuote(runs)) return [toQuote(runs)]
        const level = Math.min(4, Math.max(2, Number(n.name[1])))
        return [{ type: 'heading', level, runs: runs.map(({ text, link }) => (link ? { text, link } : { text })) }]
      }
      case 'blockquote': {
        if (SOCIAL.test(n.attrs.class ?? '')) return []
        const runs = tidy(inline(n.children))
        if (!runs.length) return []
        return [isQuote(runs) ? toQuote(runs) : { type: 'quote', runs, cite: null }]
      }
      case 'ul':
      case 'ol': {
        const items = n.children
          .filter((c): c is Element => typeof c !== 'string' && c.name === 'li')
          .map((li) => tidy(inline(li.children)))
          .filter((runs) => runs.length)
        return items.length ? [{ type: 'list', ordered: n.name === 'ol', items }] : []
      }
      case 'table': {
        const items = findAll(n, 'tr')
          .map((tr) =>
            tidy(
              findAll(tr, 'td')
                .concat(findAll(tr, 'th'))
                .map((td) => tidy(inline(td.children)))
                .filter((cell) => cell.length)
                .flatMap((cell, i) => (i ? [{ text: ' · ' }, ...cell] : cell)),
            ),
          )
          .filter((runs) => runs.length)
        return items.length ? [{ type: 'list', ordered: false, items }] : []
      }
      case 'figure': {
        const caption = textOf({ ...n, children: n.children.filter((c) => typeof c === 'string' || c.name !== 'img') })
          .replace(/\s+/g, ' ')
          .trim()
        return imageBlocks(n, caption || null)
      }
      case 'img':
        return imageBlocks(n, n.attrs.alt?.trim() || null)
      case 'iframe':
        return videoOf(n.attrs.src, n.attrs.title ?? null)
      case 'hr':
        return [{ type: 'divider' }]
      case 'pre':
        return textBlocks(textOf(n))
      default:
        return blocks(n.children)
    }
  }

  return (raw: string, featuredId: string | null): NewsBlock[] => {
    featured = featuredId
    const out = blocks(parse(prepare(raw)).children)
    return out.filter(
      (b, i) => !(b.type === 'divider' && (i === 0 || out[i - 1]?.type === 'divider' || i === out.length - 1)),
    )
  }
}

const BYLINE = /^\s*(?:text\s+(?:and\s+photos?\s+)?by|by)\s+/i
const GENERIC_TAGS = new Set(['player news'])

const tagName = (s: string) => (s.includes(' ') ? s : s.replaceAll('-', ' ')).replace(/\s+/g, ' ').trim()

export const createArticleBuilder = (ctx: BlockContext) => {
  const convert = createBlockConverter(ctx)
  return (raw: RawNews, item: NewsItem, candidates: PlayerName[] = []): NewsArticle => {
    const [text = '', photo = ''] = (raw.author[0] ?? '').split('|').map((s) => decode(s).trim())
    const names = (raw.tag ?? []).map((t) => tagName(decode(t.name)))
    const tags = [...new Map(names.map((n) => [n.toLowerCase(), n])).entries()]
      .filter(([key]) => key && !GENERIC_TAGS.has(key))
      .map(([, name]) => name)
    const linked = linkMatchedPlayers(
      convert(raw.content, item.image?.id ?? null),
      playerMatcher(candidates),
      new Set(item.players),
    )
    return {
      ...item,
      byline: text.replace(BYLINE, '') || null,
      photoCredit: photo || null,
      tags,
      matchedPlayers: linked.matched,
      blocks: linked.blocks,
    }
  }
}
