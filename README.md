# HSBC BWF World Tour, redesigned

My take on what the [HSBC BWF World Tour](https://bwfworldtour.bwfbadminton.com) website could look like, built around the way I follow the tour.

**Try it:** [hsbc-bwf-world-tour-redesign.vercel.app](https://hsbc-bwf-world-tour-redesign.vercel.app/en/calendar). It works just as well on a phone, ideally during a tournament week.

> A personal, non-commercial side project, not affiliated with, endorsed by or operated by the Badminton World Federation (BWF) or HSBC. All tournament data, results, images and logos belong to BWF, the players and their respective rights holders.

## Why

My wife and I follow most of the World Tour, mostly on BWF's YouTube channel, and we watch as much of it live as we can. When a tournament is on, we check draws, results and who's playing next almost every day.

As a software engineer, I kept imagining what the site could feel like with a more modern, phone-first design: quicker to get around, easier to follow live, and closer to the sports apps fans already use every day. So I built the version I wished existed. The official site already holds a wealth of information; this is simply an attempt at a fresh way to present it. It's meant as a friendly proposal, not a criticism: no ads, no tracking, nothing for sale, and I'd happily give all of it to BWF for free.

## Free to use

Both the designs and the code are meant as a gift and a proposal to BWF, and to anyone else who finds them useful. Take any of it, change it or ignore it. No payment, contract or credit is wanted. The code is released under the [0BSD license](LICENSE), which allows any use without conditions.

The license only covers my own work. Tournament data, results, logos and player photos belong to BWF, the players and the photographers. Third-party assets keep their own licenses, listed in [CREDITS.md](CREDITS.md).

## Highlights

Most of this information is already on the official site. The focus here is on how easy it is to find and follow.

- **One page per tournament**, opening on the day being played: overview, matches, draw, players, podium, videos and news in tabs.
- **Live matches** point by point, with game, rally and challenge stats and a head-to-head for every match.
- **Follow players and countries**, then filter matches and entries down to just them.
- **Search everywhere**, and hover any player's name for a quick card with photo, country and ranking.
- **Player profiles** with the career season by season, ranking history, partners and equipment (racket, shoes, strings and bag).
- **YouTube built in:** highlights, full matches and the live stream for each tournament, where it's available in your country. Finished matches link straight to their own replay.
- **News linked up:** articles open on the site and link to the players and tournaments they mention.
- **About the Tour:** a map of the season's stops that opens on the current or next stop and zooms and pans, linked to a timeline, plus how each level works and the race to the Finals.
- **15 languages:** English, Simplified and Traditional Chinese, Bahasa Indonesia, Bahasa Melayu, Thai, Hindi, Spanish, Danish, Korean, Japanese, French, Tagalog, Vietnamese, Brazilian Portuguese and Arabic, with a right-to-left layout for Arabic. Badminton terms were checked against each country's sports media, and dates and numbers follow the language, always on the Gregorian calendar. News articles come from BWF in English only.
- **Light, dark or system theme**, chosen in the settings next to the language, venue or local times, and metric or imperial units.
- **Phone-first:** sticky filters, swipeable rows and long names that shorten to fit.
- **Easy to find and share:** every page has its own title, description and link preview, and key pages are pre-rendered in every language for search engines.

## What isn't translated

The interface is fully translated, and country names come from the browser in each language. Content that comes from BWF or other sources as text stays as it is:

- **News articles:** BWF publishes them in English only. A notice says so on the news pages.
- **Player profiles:** bios, ambitions, achievements, coaches and clubs come from BWF and the curated overrides, in English.
- **Names:** player, tournament, venue and city names, plus racket, string and shoe models, are kept as published.
- **Video titles:** YouTube titles appear as the channel wrote them.
- **Discipline codes:** MS, WS, MD, WD and XD stay the same in every language, on purpose.

Ideas for closing the gaps, if someone wants to pick them up:

- **Articles and bios:** machine-translate them once, during the data sync, and cache the results. Use a free tier or a local open model, and label them "translated automatically" with a link to the original. Badminton terms could come from the glossaries already built for the interface.
- **Curated profile text:** add per-language fields in `data/overrides.json`, so fans who speak a language can contribute translations through pull requests.
- **City and venue names:** look up localized names from Wikidata or GeoNames during the sync.

## Running it locally

The hosted version may not stay online forever. Everything also runs on your own machine, with no accounts or cloud services needed.

You need [Node 22.22.1 or newer](https://nodejs.org) and pnpm (`corepack enable` sets up the version pinned in `package.json`).

```sh
git clone https://github.com/monthero/hsbc-bwf-world-tour-redesign.git
cd hsbc-bwf-world-tour-redesign
pnpm install
pnpm sync --from 2026   # fetches BWF data into public/data
pnpm start              # http://localhost:5173
```

- **First sync:** `--from 2026` only fetches the current season, so it's much quicker. Plain `pnpm sync` fetches every season since 2018, which can take hours the first time. Later syncs reuse the local cache and are much faster.
- **Live matches:** these work locally out of the box, because the dev server proxies BWF's live API itself. The Cloudflare Worker is only needed for a hosted deployment.
- **YouTube:** optional. Put a `YOUTUBE_API_KEY` in `.env.local` to enable the video links and live streams. It's only used on the server. Without it, the rest of the site works normally.
- **Admin:** `/admin` (dev only) edits the curated data.

## How it works

- `pnpm sync` caches BWF's responses in SQLite and exports static JSON to `public/data`. Neither is committed.
- Curated data lives in `data/` and is committed: player overrides (equipment, photos, names), equipment catalogs and city coordinates. Overrides always win over BWF's data.
- A GitHub Action syncs, builds and deploys to Vercel on every push and on a schedule. It needs the `VERCEL_TOKEN`, `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` repository secrets.
- Page URLs start with a language prefix (`/en/…`, `/zh/…`). After `vp build`, `pnpm prerender` loads the app's meta builders and Lingui catalogs through Vite's SSR loader and writes static HTML for every URL in the sitemap: title, description, canonical, `hreflang`, Open Graph tags, JSON-LD and a short visually hidden summary for crawlers and link previews. All English pages are pre-rendered, plus key pages in every language (calendar, rankings, news, about, this and next season's tournaments, the top 10 players per discipline). Set `PRERENDER_LOCALES=key|all|none` or `PRERENDER_TOP_PLAYERS` when syncing to change that scope; `PRERENDER=0` skips the step.
- During tournaments, browsers fetch live data through a small Cloudflare Worker (`workers/bwf-relay`), because BWF blocks requests from cloud servers. Deploy it with `pnpm relay:deploy`.

## Built with

- [React](https://react.dev) and [TypeScript](https://www.typescriptlang.org), built with [Vite](https://vite.dev) (through [Vite+](https://viteplus.dev))
- [Mantine](https://mantine.dev) for UI components and styling, with CSS modules
- [TanStack Router](https://tanstack.com/router), [Query](https://tanstack.com/query) and [Virtual](https://tanstack.com/virtual) for routing, data fetching and long lists
- [zod](https://zod.dev) to validate BWF's data
- [zustand](https://zustand.docs.pmnd.rs) for settings and followed players
- [dayjs](https://day.js.org) for dates and time zones
- [Lingui](https://lingui.dev) for internationalization
- [Phosphor Icons](https://phosphoricons.com) via [unplugin-icons](https://github.com/unplugin/unplugin-icons)
- [Fontsource](https://fontsource.org) Noto fonts for Chinese, Japanese, Korean, Thai, Hindi and Arabic
- [d3-geo](https://d3js.org/d3-geo), [TopoJSON](https://github.com/topojson/topojson-client) and [world-atlas](https://github.com/topojson/world-atlas) for the season map
- [sharp](https://sharp.pixelplumbing.com) to process player photos
- [Vite+](https://viteplus.dev) to run [Oxlint](https://oxc.rs/docs/guide/usage/linter) and [Oxfmt](https://oxc.rs/docs/guide/usage/formatter) for linting, formatting and type-aware checks, plus the pre-commit hook
- Node's built-in SQLite for the data sync cache, and a [Cloudflare Worker](https://developers.cloudflare.com/workers) ([wrangler](https://developers.cloudflare.com/workers/wrangler)) to relay live scores

## Contributing

Pull requests are welcome: bug fixes, design ideas, data corrections and translations. See [CONTRIBUTING.md](CONTRIBUTING.md) for how it works and the house rules.
