import { Spoiler } from '@mantine/core';
import { memo } from 'react';

import { IconExternal } from '~/components/ui';
import type { BioView } from '~/types';

import { hasProfile } from '../utils';
import { Section } from './parts';

import classes from './ProfileSection.module.css';
import shared from './shared.module.css';

const AMBITION_HEIGHT = 88;
const SPOILER = { control: shared.link };

export const ProfileSection = memo<{ bio: BioView }>(({ bio }) => {
  if (!hasProfile(bio)) return null;
  return (
    <Section
      label="Profile"
      aside={
        bio.links.length > 0 && (
          <span className={classes.links}>
            {bio.links.map((l) => (
              <a key={l.key} href={l.value} target="_blank" rel="noreferrer" className={shared.link}>
                {l.label}
                <IconExternal size={11} />
              </a>
            ))}
          </span>
        )
      }
    >
      {bio.details.length > 0 && (
        <dl className={classes.facts}>
          {bio.details.map((f) => (
            <div key={f.key} className={classes.fact}>
              <dt>{f.label}</dt>
              <dd>{f.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {bio.ambition && (
        <Spoiler maxHeight={AMBITION_HEIGHT} showLabel="Read more" hideLabel="Show less" classNames={SPOILER}>
          <p className={classes.quote}>“{bio.ambition}”</p>
        </Spoiler>
      )}
      {bio.notes.length > 0 && (
        <dl className={classes.facts} data-stack>
          {bio.notes.map((n) => (
            <div key={n.key} className={classes.fact}>
              <dt>{n.label}</dt>
              <dd>{n.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </Section>
  );
});
