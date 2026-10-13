import { Combobox, Loader, useCombobox } from '@mantine/core';
import { useHotkeys } from '@mantine/hooks';
import { useNavigate } from '@tanstack/react-router';
import { clsx } from 'clsx';
import {
  memo,
  useCallback,
  useDeferredValue,
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
} from 'react';

import { Flag } from '~/components/country';
import { PlayerAvatar, PlayerName } from '~/components/player';
import { LevelBadge, LogoTile, TournamentStatusBadge } from '~/components/tournament';
import { IconClose, IconSearch } from '~/components/ui';
import type { PlayerSearchEntry } from '~/hooks/usePlayers';
import { useSiteSearch, type SiteSearchResults } from '~/hooks/useSiteSearch';
import type { Tournament } from '~/types';
import { standingHint } from '~/utils/search';

import classes from './SiteSearch.module.css';
import utils from '~/styles/utils.module.css';

const MOD_KEY = typeof navigator !== 'undefined' && /Mac|iP(hone|ad)/.test(navigator.userAgent) ? '⌘' : 'Ctrl';
const SEP = '|';

const LABEL = 'Search players and tournaments';
const GROUP_CLASSES = { groupLabel: classes.group };

const DROPDOWN_TRANSITION = { transition: 'pop-top-right', duration: 160 } as const;

const hasHits = (r: SiteSearchResults) => r.players.length > 0 || r.tournaments.length > 0;

const PlayerOption = memo<{ entry: PlayerSearchEntry }>(({ entry: { player, standing } }) => {
  const hint = standingHint(standing);
  return (
    <Combobox.Option value={`p${SEP}${player.id}`} className={classes.option}>
      <PlayerAvatar player={player} size={34} />
      <span className={classes.main}>
        <PlayerName player={player} link={false} fit className={clsx(utils.ellipsis, classes.name)} />
        <span className={classes.meta}>
          <Flag cc={player.cc} tip={false} />
          {player.cc}
        </span>
      </span>
      {hint && (
        <span className={clsx(utils.num, classes.rank)} data-current={standing.current ? true : undefined}>
          {hint}
        </span>
      )}
    </Combobox.Option>
  );
});

const TournamentOption = memo<{ tournament: Tournament }>(({ tournament: t }) => (
  <Combobox.Option value={`t${SEP}${t.year}${SEP}${t.slug}`} className={classes.option}>
    <LogoTile src={t.logo} size={34} name={t.name} />
    <span className={classes.main}>
      <span className={clsx(utils.ellipsis, classes.name)}>{t.heading}</span>
      <span className={classes.meta}>
        <LevelBadge level={t.level} size="sm" />
        {t.dates}
      </span>
    </span>
    <TournamentStatusBadge tournament={t} variant="line" short className={classes.status} />
  </Combobox.Option>
));

export const SiteSearch = memo(() => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const deferred = useDeferredValue(query);
  const { results, ready, searching } = useSiteSearch(deferred, open);
  const combobox = useCombobox({ opened: open && searching, loop: true });
  const { selectFirstOption } = combobox;
  const navigate = useNavigate();
  const fieldId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isInside = useCallback(
    (node: EventTarget | null) =>
      node instanceof Node && !!(rootRef.current?.contains(node) || dropdownRef.current?.contains(node)),
    [],
  );

  const expand = useCallback(() => {
    setOpen(true);
    inputRef.current?.focus();
  }, []);

  const collapse = useCallback((restoreFocus: boolean) => {
    setOpen(false);
    setQuery('');
    if (restoreFocus) triggerRef.current?.focus();
  }, []);

  useHotkeys([['mod+K', expand]]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (hasHits(results)) selectFirstOption();
  }, [results, selectFirstOption]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!isInside(e.target)) collapse(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open, isInside, collapse]);

  const onBlur = useCallback(
    (e: FocusEvent) => {
      if (e.relatedTarget && !isInside(e.relatedTarget)) collapse(false);
    },
    [isInside, collapse],
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') collapse(true);
    },
    [collapse],
  );

  const onSubmit = useCallback(
    (value: string) => {
      const [kind = '', a = '', b = ''] = value.split(SEP);
      collapse(false);
      inputRef.current?.blur();
      if (kind === 'p') void navigate({ to: '/players/$id', params: { id: a } });
      else void navigate({ to: '/world-tour/$year/$slug', params: { year: a, slug: b } });
    },
    [navigate, collapse],
  );

  const onClose = useCallback(() => collapse(true), [collapse]);

  return (
    <div ref={rootRef} className={classes.search} data-open={open || undefined} onBlur={onBlur}>
      <button
        ref={triggerRef}
        type="button"
        className={classes.trigger}
        onClick={expand}
        aria-label={`${LABEL} (${MOD_KEY} K)`}
        aria-expanded={open}
        aria-controls={fieldId}
        tabIndex={open ? -1 : undefined}
      >
        <IconSearch />
      </button>
      <Combobox
        store={combobox}
        onOptionSubmit={onSubmit}
        width="target"
        position="bottom-end"
        offset={8}
        transitionProps={DROPDOWN_TRANSITION}
      >
        <Combobox.DropdownTarget>
          <div id={fieldId} className={classes.field} inert={!open}>
            <IconSearch className={classes.fieldIcon} />
            <Combobox.EventsTarget withExpandedAttribute>
              <input
                ref={inputRef}
                className={classes.input}
                value={query}
                onChange={(e) => setQuery(e.currentTarget.value)}
                onKeyDown={onKeyDown}
                placeholder={LABEL}
                aria-label={LABEL}
              />
            </Combobox.EventsTarget>
            <button type="button" className={classes.close} aria-label="Close search" onClick={onClose}>
              <IconClose />
            </button>
          </div>
        </Combobox.DropdownTarget>
        <Combobox.Dropdown ref={dropdownRef} className={clsx(utils.popover, classes.dropdown)}>
          <div className={classes.results}>
            <Combobox.Options aria-label="Search results">
              {results.tournaments.length > 0 && (
                <Combobox.Group label="Tournaments" classNames={GROUP_CLASSES}>
                  {results.tournaments.map((e) => (
                    <TournamentOption key={e.tournament.code} tournament={e.tournament} />
                  ))}
                </Combobox.Group>
              )}
              {results.players.length > 0 && (
                <Combobox.Group label="Players" classNames={GROUP_CLASSES}>
                  {results.players.map((e) => (
                    <PlayerOption key={e.player.id} entry={e} />
                  ))}
                </Combobox.Group>
              )}
            </Combobox.Options>
            {!ready && (
              <div className={classes.hint}>
                <Loader color="red" size="xs" />
              </div>
            )}
            {ready && !hasHits(results) && <p className={classes.hint}>Nothing matches “{deferred.trim()}”.</p>}
          </div>
        </Combobox.Dropdown>
      </Combobox>
    </div>
  );
});
