import { Link } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { use, useMemo, useState, type CSSProperties, type FC, type MouseEvent, type ReactNode } from 'react';

import { PlayerHoverContext } from '~/contexts';
import { useFitLevel } from '~/hooks/useFitLevel';
import { usePlayerLinkSearch } from '~/hooks/usePlayerLinkSearch';
import type { Player } from '~/types';
import { nameForms, type NameForm } from '~/utils/names';

import classes from './PlayerName.module.css';
import utils from '~/styles/utils.module.css';

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
  end?: ReactNode;
}> = ({ player, link = true, layout = 'inline', short, fit, className, firstClassName, lastClassName, end }) => {
  const search = usePlayerLinkSearch();
  const renderHover = use(PlayerHoverContext);
  const forms = useMemo(
    () => (fit && !short && layout === 'inline' ? nameForms(player) : NO_FORMS),
    [fit, short, layout, player],
  );
  const [trail, setTrail] = useState<HTMLSpanElement | null>(null);
  const [sizer, level, reserve] = useFitLevel<HTMLSpanElement>(trail);
  const fitted = forms.length > 0;
  const boxed = fitted && end !== undefined;
  const inline = fitted && !boxed;
  const parts = { surnameFirst: player.surnameFirst, layout, firstClassName, lastClassName };
  const measures = fitted && (
    <span key={forms.length} ref={sizer} className={classes.sizer} aria-hidden>
      {forms.map((form) => (
        <span key={`${form.first} ${form.last}`} className={classes.measure}>
          <NameParts {...parts} form={form} />
        </span>
      ))}
    </span>
  );
  const body = short ? (
    <span className={lastClassName} data-strong>
      {player.surname}
    </span>
  ) : (
    <>
      {inline && measures}
      <NameParts {...parts} form={forms[level] ?? player} />
    </>
  );
  const cls = clsx(classes.playerName, utils.bidiAuto, className);
  const label = fitted && level > 0 ? player.name : undefined;
  const named =
    !link || !player.id ? (
      <span className={cls} data-layout={layout} data-fit={inline || undefined} aria-label={label} translate="no">
        {body}
      </span>
    ) : (
      <Link
        to="/players/$id"
        params={{ id: player.id }}
        search={search}
        className={cls}
        data-layout={layout}
        data-fit={inline || undefined}
        aria-label={label}
        translate="no"
        onClick={stop}
      >
        {body}
      </Link>
    );
  const hovered = link && player.id && renderHover ? renderHover(player.id, named) : named;
  if (end === undefined) return hovered;
  if (!boxed)
    return (
      <>
        {hovered}
        {end}
      </>
    );
  return (
    <span className={classes.fit} style={{ '--fit-reserve': `${reserve}px` } as CSSProperties}>
      {measures}
      <span className={classes.line}>
        {hovered}
        <span ref={setTrail} className={classes.trail}>
          {end}
        </span>
      </span>
    </span>
  );
};
