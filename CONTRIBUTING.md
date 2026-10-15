# Contributing

Thanks for wanting to help! This is a personal, non-commercial side project, but contributions are welcome: bug fixes, design improvements, data corrections and translations.

Using an AI coding agent? Point it at [AGENTS.md](AGENTS.md), which sums up the architecture and conventions.

## How it works

- Anyone can fork the repository and open a pull request against `main`.
- Only the maintainer ([@monthero](https://github.com/monthero)) reviews and merges pull requests. Every change goes through a pull request; nobody else has write access.
- Opening a pull request doesn't guarantee it will be merged. The site follows a particular design direction, so some changes may be declined or reworked, even good ones.
- For anything bigger than a small fix, please open an issue first to talk it through. That saves you from building something that won't fit.
- Pull requests never deploy anything. The site only deploys after a change is merged into `main`.

## License of your contributions

The project is released under the [0BSD license](LICENSE). By opening a pull request, you agree that your contribution is released under the same license. Only submit work you have the right to share.

Don't add data, images or logos you don't have the rights to. Tournament data, results, logos and player photos belong to BWF, the players and the photographers.

## Getting set up

You need Node 22.22.1 or newer and pnpm (`corepack enable` sets up the pinned version). See [Running it locally](README.md#running-it-locally) for the full steps:

```sh
pnpm install
pnpm sync --from 2026
pnpm start
```

## Before opening a pull request

A pre-commit hook, installed automatically by `pnpm install`, formats and checks your staged files on every commit. Before opening a pull request, also run the full checks and make sure they pass:

```sh
pnpm typecheck
pnpm exec vp check
```

`vp check` ([Vite+](https://viteplus.dev)) runs Oxfmt, Oxlint and type-aware checks in one go. The same checks run on every pull request.

Then check your change in the browser, **on desktop and at phone width (390px)**. The site is designed phone-first, so a change that only works on desktop isn't finished.

In the pull request description, say what you changed and why. For visual changes, add screenshots (desktop and mobile).

## Commits

- Keep each commit focused on one change.
- Write the message as one plain sentence in the imperative mood, without prefixes like `feat:` or `fix:`.
  - Good: `Show the venue time zone in the match card`
  - Not: `feat: added venue tz to match card`
- Don't commit generated files: `public/data`, `dist`, the SQLite cache and anything else listed in `.gitignore`.
- Never commit secrets such as API keys or `.env.local`.

## Code style

- TypeScript and React function components (arrow functions), with [Mantine](https://mantine.dev) and CSS modules. No global CSS.
- Take colours from the theme (`src/theme.ts` and the `--bwf-*` variables), never hard-coded hex or rgba values.
- Use dayjs for dates.
- Use icons from [Phosphor](https://phosphoricons.com) through `src/components/ui/icons.ts`.
- Reuse what already exists. If something is needed twice, make it a shared component or helper.
- Keep code self-explanatory, so it doesn't need comments.
- Identify players by their BWF id (in URLs, keys and favourites), never by name. Show names in the order BWF provides them.
- Only free and open-source libraries and services. Please ask in an issue before adding a new dependency.

## Translations

- All visible text goes through [Lingui](https://lingui.dev): `Trans` and `useLingui` from `@lingui/react/macro`, and `msg` from `@lingui/core/macro` for text defined outside components.
- After adding or changing text, run `pnpm i18n:extract` to update the catalogs in `src/locales`.
- When translating, check where each text appears on the site, so the translation fits its context.
- If you're a native speaker and spot an awkward translation, a pull request that fixes it is very welcome.

## Data corrections

Curated data (equipment, photos, name fixes) lives in `data/overrides.json`. Please say where the information comes from in the pull request, for example a player's own social media or a brand's page.

## Be kind

Be respectful in issues and pull requests. This is a hobby project made by a fan for other fans.
