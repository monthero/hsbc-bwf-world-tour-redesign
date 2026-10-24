import { Trans, useLingui } from '@lingui/react/macro';
import { Spoiler } from '@mantine/core';
import { clsx } from 'clsx';
import { memo } from 'react';

import { FactLabel, FactTip, SocialLinks } from '~/components/player';
import { IconCollapse, IconExpand } from '~/components/ui';
import type { BioView, FactItem } from '~/types';

import { hasProfile } from '../utils';
import { Section } from './parts';

import classes from './ProfileSection.module.css';
import shared from './shared.module.css';

const AMBITION_HEIGHT = 88;
const SPOILER = { control: clsx(shared.link, classes.toggle) };
const SHOW = <IconExpand size={16} />;
const HIDE = <IconCollapse size={16} />;

export const ProfileSection = memo<{ bio: BioView }>(({ bio }) => {
  const { t } = useLingui();
  if (!hasProfile(bio)) return null;
  return (
    <Section
      label={<Trans comment="Section title: the player’s biography facts, quote and social links">Profile</Trans>}
      aside={
        bio.links.length > 0 && (
          <span className={classes.follow}>
            <span className={shared.label}>
              <Trans
                context="social media"
                comment="Label before a player’s Instagram and Facebook icon links, like “Socials”"
              >
                Socials
              </Trans>
            </span>
            <SocialLinks links={bio.links} />
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
          showAriaLabel={t({ message: 'Read more', comment: 'Expands the player’s quote' })}
          hideAriaLabel={t({ message: 'Show less', comment: 'Collapses the player’s quote' })}
          classNames={SPOILER}
        >
          <p className={classes.quote} lang="en" dir="auto">
            “{bio.ambition}”
          </p>
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
      <dd lang={f.lang}>{f.value}</dd>
    </div>
  </FactTip>
));
