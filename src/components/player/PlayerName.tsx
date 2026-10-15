import { Link } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { use, useMemo, type FC, type MouseEvent } from 'react';

import { PlayerHoverContext } from '~/contexts';
import { useFitLevel } from '~/hooks/useFitLevel';
import { usePlayerLinkSearch } from '~/hooks/usePlayerLinkSearch';
import type { Player } from '~/types';
import { nameForms, type NameForm } from '~/utils/names';

import classes from './PlayerName.module.css';

const stop = (e: MouseEvent) => e.stopPropagation();

const NO_FORMS: NameForm[] = [];

type PartsProps = {
  form: NameForm;
  surnameFirst: boolean;
  layout: 'inline' | 'stacked';
  firstClassName?: string;
  lastClassName?: string;
};

const NameParts: FC<PartsProps> = ({ form, surnameFirst, layout, firstClassName, lastClassName }) => (
  <>
    <span className={firstClassName} data-strong={surnameFirst || undefined}>
      {form.first}
    </span>
    {form.last && layout === 'inline' && ' '}
    {form.last && (
      <span className={lastClassName} data-strong={!surnameFirst || undefined}>
        {form.last}
      </span>
    )}
  </>
);

export const PlayerName: FC<{
  player: Player;
  link?: boolean;
  layout?: 'inline' | 'stacked';
  short?: boolean;
  fit?: boolean;
  className?: string;
  firstClassName?: string;
  lastClassName?: string;
}> = ({ player, link = true, layout = 'inline', short, fit, className, firstClassName, lastClassName }) => {
  const search = usePlayerLinkSearch();
  const renderHover = use(PlayerHoverContext);
  const forms = useMemo(
    () => (fit && !short && layout === 'inline' ? nameForms(player) : NO_FORMS),
    [fit, short, layout, player],
  );
  const [sizer, level] = useFitLevel<HTMLSpanElement>();
  const fitted = forms.length > 0;
  const parts = { surnameFirst: player.surnameFirst, layout, firstClassName, lastClassName };
  const body = short ? (
    <span className={lastClassName} data-strong>
      {player.surname}
    </span>
  ) : (
    <>
      {fitted && (
        <span key={forms.length} ref={sizer} className={classes.sizer} aria-hidden>
          {forms.map((form) => (
            <span key={`${form.first} ${form.last}`} className={classes.measure}>
              <NameParts {...parts} form={form} />
            </span>
          ))}
        </span>
      )}
      <NameParts {...parts} form={forms[level] ?? player} />
    </>
  );
  const cls = clsx(classes.playerName, className);
  const label = fitted && level > 0 ? player.name : undefined;
  const named =
    !link || !player.id ? (
      <span className={cls} data-layout={layout} data-fit={fitted || undefined} aria-label={label} translate="no">
        {body}
      </span>
    ) : (
      <Link
        to="/players/$id"
        params={{ id: player.id }}
        search={search}
        className={cls}
        data-layout={layout}
        data-fit={fitted || undefined}
        aria-label={label}
        translate="no"
        onClick={stop}
      >
        {body}
      </Link>
    );
  return link && player.id && renderHover ? renderHover(player.id, named) : named;
};
