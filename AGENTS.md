# AGENTS.md

Guidance for AI coding agents (Claude Code, Copilot, Cursor and others) working in this repository. Human contributors should start with [CONTRIBUTING.md](CONTRIBUTING.md); everything there applies here too.

## What this is

An unofficial, non-commercial, fan-made redesign of the [HSBC BWF World Tour](https://bwfworldtour.bwfbadminton.com) website, offered to BWF as a gift under the 0BSD license. It's a phone-first React single-page app fed by BWF's public data. It isn't affiliated with BWF or HSBC.

## Commands

Node 22.22.1 or newer, pnpm (pinned in `package.json`).

```sh
pnpm install            # also installs the Vite+ git hooks
pnpm sync --from 2026   # fetch BWF data into a SQLite cache and export public/data
pnpm sync:export        # re-export from the cache, offline, in seconds
pnpm start              # dev server at http://localhost:5173
pnpm typecheck          # tsc -b
pnpm exec vp check      # Oxfmt + Oxlint + type-aware checks
pnpm exec vp check --fix
pnpm i18n:extract       # update the Lingui catalogs in src/locales
pnpm i18n:check         # per-locale summary; fails on broken placeholders/plurals (--fail-on-missing for gaps)
pnpm data:check         # catalog ids are valid and every equipment override points at one
pnpm build
```

A pre-commit hook (`.vite-hooks/pre-commit` → `vp staged`) runs `vp check --fix` on staged files. Pull requests run `pnpm typecheck`, `vp check`, a curated-data check (`pnpm data:check`), a stale-catalog check (`pnpm i18n:extract` must leave `src/locales` unchanged) and `pnpm i18n:check` in CI. There are no tests; verify by running the checks and looking at the page on desktop and at 390px wide.

## Architecture

- **Data sync** (`scripts/sync`, plain Node with `node:sqlite`, no dependencies):
  - It fetches BWF's API into `data/bwf.sqlite`, which is gitignored. Every raw response is stored, and tables are re-derived from them.
  - It then exports static JSON to `public/data`, also gitignored: `seasons.json`, `calendar-{year}.json`, `tournaments/{code}.json`, `players.json`, `players/{id}.json`, rankings, series and news.
  - It covers World Tour seasons since 2018.
- **Curated data** (`data/*.json`, committed):
  - `overrides.json` holds per-player overrides: bio, equipment, photos and names. Overrides always win over BWF data.
  - `brands.json` and `equipment.json` form the equipment catalog. Each product has a UUIDv4 `id`, and the racket, string and shoes overrides store that id. The export turns it into the product name and fails on an unknown id.
  - `catalog.json` holds the tournament series and city overrides.
- **App** (`src`):
  - Data flow: files in `public/data` → zod schemas (`src/api/schemas.ts`) → TanStack Query (`src/api/queries.ts`, `src/hooks`) → pages.
  - Live data during tournaments comes from BWF's live API. In dev it goes through a Vite proxy (`server/bwf-proxy.ts`); in production the browser calls a Cloudflare Worker relay (`workers/bwf-relay`).
  - Archived events read the static export instead.
- **Server code** (`server`): Vite dev middlewares (BWF proxy, YouTube, news, admin API) and shared upstream logic. `api/youtube.ts` is the only serverless function in production. The YouTube API key is server-side only and must never reach the browser.
- **Admin** (`/admin`, `src/pages/admin` + `server/admin.ts`): a local, dev-only editor for `data/overrides.json`. Production builds don't include it.
- **Deploy:** a GitHub Action syncs data, builds and deploys to Vercel on pushes to `main` and on a schedule.

## Where things live

| Path                                   | What                                                                                                                                      |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `src/routes`                           | TanStack Router file routes (`routeTree.gen.ts` is generated)                                                                             |
| `src/pages/<page>`                     | Page components, with page-local `components/`, `utils.ts`, `constants.ts`                                                                |
| `src/components/<domain>`              | Shared components by domain (`ui`, `player`, `match`, `tournament`, `media`, `news`, `follow`, `layout`…), each with an `index.ts` barrel |
| `src/components/ui/icons.ts`           | The only place icons are imported                                                                                                         |
| `src/utils`, `src/hooks`, `src/stores` | Shared helpers, hooks and zustand stores                                                                                                  |
| `src/theme.ts`                         | Mantine theme, palettes and `--bwf-*` CSS variables                                                                                       |
| `src/i18n`, `src/locales`              | Lingui setup and PO catalogs                                                                                                              |
| `scripts/sync`                         | Data pipeline                                                                                                                             |
| `server`, `workers`, `api`             | Dev middlewares, relay Worker, Vercel function                                                                                            |

## Conventions

These are the maintainer's explicit rules. Follow them in every change.

- **No code comments**, in any file. Keep JSX lean, without needless wrapper elements.
- **Components:** `const Name: FC<Props> = (…) => …` or `memo<Props>(…)`, never `function Name`.
- **Performance:**
  - Hoist constants, option lists and pure helpers to module scope.
  - `useMemo` derived data, `useCallback` handlers passed to memoized children, and `memo` repeated list items.
  - Use narrow zustand selectors.
- **No repeated code:** anything used in two places becomes a shared component, hook or helper. Check `src/components`, `src/utils` and `src/hooks` before writing new ones.
- **Styling:**
  - Mantine plus CSS modules, with native nesting where it helps. No global CSS.
  - No hard-coded colours: use theme palettes, `--bwf-*` variables and `alpha(var(…), n)`.
  - Layouts are fluid, without a fixed page width.
  - Prefer logical properties (`margin-inline-start`, `padding-inline`, `inset-inline-end`, `text-align: start`) over left/right, so a right-to-left locale can be added later. Each locale's direction is `localeDir` in `src/i18n/locales.ts`.
- **Mobile first:** design and check every change at 390px as carefully as on desktop. That means tap targets, no horizontal overflow, and sensible sticky and scroll behaviour.
- **Icons:**
  - Phosphor (`ph`) through `src/components/ui/icons.ts`. Badminton-specific icons are custom SVGs in `src/assets/icons` (`~icons/bwf/...`).
  - Small icons use the regular, bold or fill weights only. Duotone is reserved for large decorative glyphs.
  - Where an icon replaces a text label, keep the label as an `aria-label` or tooltip (`Tip`).
- **Players:**
  - Identify players by their BWF id in URLs, keys, favourites and lookups, never by name.
  - Show names in the order the BWF data gives them, title-casing only the uppercase surname, with no reordering by country.
  - Rendered player names link to their profile through the shared components (`PlayerName`, `TeamPlayers`).
- **Dates:** dayjs helpers only (`src/utils/dates.ts` in the app, `scripts/sync/dates.ts` in Node), and the Gregorian calendar only, in every locale.
- **zod:** a schema and its type share one name (`export const EventCode = z.enum(…)` plus `export type EventCode = z.infer<typeof EventCode>`), with no `Schema` suffix.
- **Lint style:**
  - Always pass a compare function to `sort`.
  - Use `.at(-1)`, not `[length - 1]`.
  - No nested ternaries.
  - Use `Number.parseInt` and `Number.isNaN`.
- **Formatting:** Oxfmt with semicolons, single quotes, trailing commas and a print width of 120. `vp check --fix` applies it.
- **Translations (Lingui):**
  - All visible text goes through `Trans` or `useLingui` (`@lingui/react/macro`). Text defined at module level uses `msg` (`@lingui/core/macro`) and is translated at render.
  - Use templates with named placeholders and ICU plurals; never concatenate English fragments.
  - Add a translator `comment` to short or ambiguous strings.
  - Never put `plural()`/`select()` inside a `message:` property, alone or in a template literal: the build compiles it to the wrong id. Write the ICU string in `msg()` and pass the values at render time (`i18n._({ ...MESSAGE, values })`); `pnpm build` fails on ids missing from the catalog (`pnpm i18n:ids`).
  - Every locale has a URL prefix, English included (`/en/...`, `/zh/...`). A URL without a prefix redirects to the saved locale, or to English.
  - Run `pnpm i18n:extract` after changing text.
- **Dependencies:** free and open-source only, and ask before adding one. When one is added or removed, update the "Built with" list in the README, and CREDITS.md if its license asks for credit.
- **Data:**
  - Overrides don't record where a value came from.
  - Equipment values come from the maintainer. Don't add them from other sites.
  - Never invent facts.
- **Secrets:** never commit `.env.local`, never give a secret a `VITE_` prefix, and never print secret values.

## Git

- Commit messages are one plain imperative sentence, with no `feat:`-style prefixes. Keep each commit focused.
- Don't commit or push unless you've been asked to. Every push to `main` deploys the site.
- Don't commit generated output: `public/data`, `public/assets/players` or `dist`.
