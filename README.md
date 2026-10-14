# HSBC BWF World Tour, redesigned

My take on what the [HSBC BWF World Tour](https://bwfworldtour.bwfbadminton.com) website could look like, built around the way I follow the tour.

**Try it:** [hsbc-bwf-world-tour-redesign.vercel.app](https://hsbc-bwf-world-tour-redesign.vercel.app/calendar). It works just as well on a phone, ideally during a tournament week.

> A personal, non-commercial side project, not affiliated with, endorsed by or operated by the Badminton World Federation (BWF) or HSBC. All tournament data, results, images and logos belong to BWF, the players and their respective rights holders.

## Why

My wife and I follow most of the World Tour, mostly on BWF's YouTube channel, and we watch as much of it live as we can. When a tournament is on, we check draws, results and who's playing next almost every day.

As a software engineer, I always felt the official site made that harder than it needed to be, especially on a phone. So I built the version I wished existed. It's meant as a friendly proposal, not a criticism: no ads, no tracking, nothing for sale, and I'd happily give all of it to BWF for free.

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
- **YouTube built in:** highlights, full matches and the live stream for each tournament, where it's available in your country.
- **News linked up:** articles open on the site and link to the players and tournaments they mention.
- **About the Tour:** a map of the season's stops linked to a timeline, how each level works and the race to the Finals.
- **Phone-first:** sticky filters, swipeable rows and long names that shorten to fit.

## Running it locally

The hosted version may not stay online forever. Everything also runs on your own machine, with no accounts or cloud services needed.

You need [Node 22+](https://nodejs.org) and pnpm (`corepack enable` sets up the version pinned in `package.json`).

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
- During tournaments, browsers fetch live data through a small Cloudflare Worker (`workers/bwf-relay`), because BWF blocks requests from cloud servers. Deploy it with `pnpm relay:deploy`.

## Built with

React, TypeScript, Vite, [Mantine](https://mantine.dev), [TanStack Router and Query](https://tanstack.com), [zod](https://zod.dev) and [dayjs](https://day.js.org), with a Node + SQLite data pipeline.
