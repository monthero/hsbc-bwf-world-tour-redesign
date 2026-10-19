import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
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
  type Ref,
} from 'react';

import { Flag } from '~/components/country';
import { PlayerAvatar, PlayerName, RetiredBadge } from '~/components/player';
import { LevelBadge, LogoTile, TournamentStatusBadge } from '~/components/tournament';
import { BottomSheet, IconClose, IconSearch, SearchField } from '~/components/ui';
import { useIsMobile } from '~/hooks/useIsMobile';
import type { PlayerSearchEntry } from '~/hooks/usePlayers';
import { useSiteSearch, type SiteSearchResults } from '~/hooks/useSiteSearch';
import { useSearchStore } from '~/stores/search';
import type { Tournament } from '~/types';
import { MOD_KEY } from '~/utils/platform';
import { standingHint } from '~/utils/search';

import classes from './SiteSearch.module.css';
import utils from '~/styles/utils.module.css';

const SEP = '|';

const LABEL = msg`Search players and tournaments`;
const GROUP_CLASSES = { groupLabel: classes.group };

const DROPDOWN_TRANSITION = { transition: 'pop-top-right', duration: 160 } as const;

const hasHits = (r: SiteSearchResults) => r.players.length > 0 || r.tournaments.length > 0;

const useOpenResult = () => {
  const navigate = useNavigate();
  return useCallback(
    (value: string) => {
      const [kind = '', a = '', b = ''] = value.split(SEP);
      if (kind === 'p') void navigate({ to: '/players/$id', params: { id: a } });
      else void navigate({ to: '/world-tour/$year/$slug', params: { year: a, slug: b } });
    },
    [navigate],
  );
};

const PlayerOption = memo<{ entry: PlayerSearchEntry }>(({ entry: { player, standing, retired } }) => {
  const hint = standingHint(standing);
  return (
    <Combobox.Option value={`p${SEP}${player.id}`} className={classes.option}>
      <PlayerAvatar player={player} size={34} />
      <span className={classes.main}>
        <PlayerName player={player} link={false} fit className={clsx(utils.ellipsis, classes.name)} />
        <span className={classes.meta}>
          <Flag cc={player.cc} tip={false} />
          {player.cc}
          <RetiredBadge retired={retired} size="xs" />
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
      <span className={clsx(utils.ellipsis, utils.bidiAuto, classes.name)}>{t.heading}</span>
      <span className={classes.meta}>
        <LevelBadge level={t.level} size="sm" />
        {t.dates}
      </span>
    </span>
    <TournamentStatusBadge tournament={t} variant="line" short className={classes.status} />
  </Combobox.Option>
));

const Results = memo<{ results: SiteSearchResults; ready: boolean; typed: string }>(({ results, ready, typed }) => {
  const { t } = useLingui();
  return (
    <>
      <Combobox.Options aria-label={t`Search results`}>
        {results.tournaments.length > 0 && (
          <Combobox.Group label={t`Tournaments`} classNames={GROUP_CLASSES}>
            {results.tournaments.map((e) => (
              <TournamentOption key={e.tournament.code} tournament={e.tournament} />
            ))}
          </Combobox.Group>
        )}
        {results.players.length > 0 && (
          <Combobox.Group label={t`Players`} classNames={GROUP_CLASSES}>
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
      {ready && !hasHits(results) && (
        <p className={classes.hint}>
          <Trans comment="Site search empty state; {typed} is what the visitor typed">Nothing matches “{typed}”.</Trans>
        </p>
      )}
    </>
  );
});

const SearchTrigger = memo<{
  ref?: Ref<HTMLButtonElement>;
  expanded: boolean;
  controls?: string;
  hidden?: boolean;
  onClick: () => void;
}>(({ ref, expanded, controls, hidden, onClick }) => {
  const { t } = useLingui();
  return (
    <button
      ref={ref}
      type="button"
      className={classes.trigger}
      onClick={onClick}
      aria-label={t({
        message: `Search players and tournaments (${MOD_KEY} K)`,
        comment: 'Search button accessible name with its keyboard shortcut; {MOD_KEY} is Ctrl or ⌘',
      })}
      aria-expanded={expanded}
      aria-controls={controls}
      tabIndex={hidden ? -1 : undefined}
    >
      <IconSearch />
    </button>
  );
});

const SheetSearch = memo<{ onDone: () => void }>(({ onDone }) => {
  const [query, setQuery] = useState('');
  const deferred = useDeferredValue(query);
  const { results, ready, searching } = useSiteSearch(deferred, true);
  const combobox = useCombobox();
  const { selectFirstOption } = combobox;
  const openResult = useOpenResult();
  const { i18n } = useLingui();
  const label = i18n._(LABEL);

  useEffect(() => {
    if (hasHits(results)) selectFirstOption();
  }, [results, selectFirstOption]);

  const onSubmit = useCallback(
    (value: string) => {
      onDone();
      openResult(value);
    },
    [onDone, openResult],
  );

  return (
    <Combobox store={combobox} onOptionSubmit={onSubmit}>
      <div className={classes.sheetHead}>
        <Combobox.EventsTarget>
          <SearchField
            size="lg"
            value={query}
            onChange={setQuery}
            placeholder={label}
            aria-label={label}
            enterKeyHint="go"
            data-autofocus
            className={classes.sheetField}
          />
        </Combobox.EventsTarget>
      </div>
      <div className={classes.sheetResults}>
        {searching && <Results results={results} ready={ready} typed={deferred.trim()} />}
      </div>
    </Combobox>
  );
});

const MobileSearch = memo<{ className?: string }>(({ className }) => {
  const open = useSearchStore((s) => s.open);
  const setOpen = useSearchStore((s) => s.setOpen);
  const expand = useCallback(() => setOpen(true), [setOpen]);
  const close = useCallback(() => setOpen(false), [setOpen]);

  useHotkeys([['mod+K', expand]]);

  return (
    <div className={clsx(classes.search, className)}>
      <SearchTrigger expanded={open} onClick={expand} />
      <BottomSheet opened={open} onClose={close} handle bodyClassName={classes.sheetBody}>
        <SheetSearch onDone={close} />
      </BottomSheet>
    </div>
  );
});

const HeaderSearch = memo<{ className?: string }>(({ className }) => {
  const open = useSearchStore((s) => s.open);
  const setOpen = useSearchStore((s) => s.setOpen);
  const [query, setQuery] = useState('');
  const deferred = useDeferredValue(query);
  const { results, ready, searching } = useSiteSearch(deferred, open);
  const combobox = useCombobox({ opened: open && searching, loop: true });
  const { selectFirstOption } = combobox;
  const openResult = useOpenResult();
  const fieldId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { t, i18n } = useLingui();
  const label = i18n._(LABEL);

  const isInside = useCallback(
    (node: EventTarget | null) =>
      node instanceof Node && !!(rootRef.current?.contains(node) || dropdownRef.current?.contains(node)),
    [],
  );

  const expand = useCallback(() => {
    setOpen(true);
    inputRef.current?.focus();
  }, [setOpen]);

  const collapse = useCallback(
    (restoreFocus: boolean) => {
      setOpen(false);
      setQuery('');
      if (restoreFocus) triggerRef.current?.focus();
    },
    [setOpen],
  );

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
      collapse(false);
      inputRef.current?.blur();
      openResult(value);
    },
    [collapse, openResult],
  );

  const onClose = useCallback(() => collapse(true), [collapse]);

  return (
    <div ref={rootRef} className={clsx(classes.search, className)} data-open={open || undefined} onBlur={onBlur}>
      <SearchTrigger ref={triggerRef} expanded={open} controls={fieldId} hidden={open} onClick={expand} />
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
                placeholder={label}
                aria-label={label}
              />
            </Combobox.EventsTarget>
            <button type="button" className={classes.close} aria-label={t`Close search`} onClick={onClose}>
              <IconClose />
            </button>
          </div>
        </Combobox.DropdownTarget>
        <Combobox.Dropdown ref={dropdownRef} className={clsx(utils.popover, classes.dropdown)}>
          <div className={classes.results}>
            <Results results={results} ready={ready} typed={deferred.trim()} />
          </div>
        </Combobox.Dropdown>
      </Combobox>
    </div>
  );
});

export const SiteSearch = memo<{ className?: string }>(({ className }) =>
  useIsMobile() ? <MobileSearch className={className} /> : <HeaderSearch className={className} />,
);
