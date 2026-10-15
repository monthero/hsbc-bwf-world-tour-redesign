import { Spoiler } from '@mantine/core';
import { clsx } from 'clsx';
import { memo, type FC } from 'react';

import { FactLabel, FactTip } from '~/components/player';
import { IconCollapse, IconExpand, IconFacebook, IconInstagram, Tip, type IconProps } from '~/components/ui';
import type { BioView, FactItem } from '~/types';

import { hasProfile } from '../utils';
import { Section } from './parts';

import classes from './ProfileSection.module.css';
import shared from './shared.module.css';

const AMBITION_HEIGHT = 88;
const SPOILER = { control: clsx(shared.link, classes.toggle) };
const SHOW = <IconExpand size={16} />;
const HIDE = <IconCollapse size={16} />;
const SOCIAL_ICONS: Partial<Record<string, FC<IconProps>>> = { instagram: IconInstagram, facebook: IconFacebook };

export const ProfileSection = memo<{ bio: BioView }>(({ bio }) => {
  if (!hasProfile(bio)) return null;
  return (
    <Section
      label="Profile"
      aside={
        bio.links.length > 0 && (
          <span className={classes.links}>
            {bio.links.map((l) => (
              <Social key={l.key} link={l} />
            ))}
          </span>
        )
      }
    >
      {bio.details.length > 0 && (
        <dl className={classes.facts}>
          {bio.details.map((f) => (
            <Fact key={f.key} item={f} />
          ))}
        </dl>
      )}
      {bio.ambition && (
        <Spoiler
          maxHeight={AMBITION_HEIGHT}
          showLabel={SHOW}
          hideLabel={HIDE}
          showAriaLabel="Read more"
          hideAriaLabel="Show less"
          classNames={SPOILER}
        >
          <p className={classes.quote}>“{bio.ambition}”</p>
        </Spoiler>
      )}
      {bio.notes.length > 0 && (
        <dl className={classes.facts} data-stack>
          {bio.notes.map((n) => (
            <Fact key={n.key} item={n} />
          ))}
        </dl>
      )}
    </Section>
  );
});

const Fact = memo<{ item: FactItem }>(({ item: f }) => (
  <FactTip id={f.key} label={f.label}>
    <div className={classes.fact}>
      <dt>
        <FactLabel id={f.key} label={f.label} size={14} />
      </dt>
      <dd>{f.value}</dd>
    </div>
  </FactTip>
));

const Social = memo<{ link: FactItem }>(({ link: l }) => {
  const Icon = SOCIAL_ICONS[l.key];
  return (
    <Tip label={l.label} tap={false}>
      <a href={l.value} target="_blank" rel="noreferrer" aria-label={l.label} className={classes.social}>
        {Icon ? <Icon size={18} /> : l.label}
      </a>
    </Tip>
  );
});
