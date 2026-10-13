import { Link } from '@tanstack/react-router';
import { memo, use, type ReactNode } from 'react';

import type { NewsLink, NewsRun } from '~/api/schemas';
import type { Tournament } from '~/types';
import { date } from '~/utils/dates';
import { tournamentParams } from '~/utils/tournaments';

import { LookupContext } from '../../context';

import classes from './Blocks.module.css';

type TournamentLink = Extract<NewsLink, { kind: 'tournament' }>;

const tournamentSearch = (link: TournamentLink, t: Tournament) => ({
  tab: link.tab,
  day: link.date ? Math.max(0, date(link.date).diff(date(t.start), 'day')) : undefined,
});

const RunLink = memo<{ link: NewsLink; children: ReactNode }>(({ link, children }) => {
  const lookup = use(LookupContext);
  if (link.kind === 'player')
    return (
      <Link to="/players/$id" params={{ id: link.id }} className={classes.link} data-kind="player">
        {children}
      </Link>
    );
  if (link.kind === 'news')
    return (
      <Link to="/news/$id" params={{ id: link.id }} className={classes.link}>
        {children}
      </Link>
    );
  if (link.kind === 'external')
    return (
      <a href={link.href} target="_blank" rel="noreferrer" className={classes.link}>
        {children}
      </a>
    );
  const t = lookup?.byCode.get(link.code);
  if (!t) return children;
  return (
    <Link
      to="/world-tour/$year/$slug"
      params={tournamentParams(t)}
      search={tournamentSearch(link, t)}
      className={classes.link}
    >
      {children}
    </Link>
  );
});

const Run = memo<{ run: NewsRun }>(({ run }) => {
  let body: ReactNode = run.text;
  if (run.italic) body = <em>{body}</em>;
  if (run.bold) body = <strong>{body}</strong>;
  return run.link ? <RunLink link={run.link}>{body}</RunLink> : body;
});

export const Runs = memo<{ runs: readonly NewsRun[] }>(({ runs }) => runs.map((r, i) => <Run key={i} run={r} />));
