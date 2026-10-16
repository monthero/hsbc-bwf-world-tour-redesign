import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { memo } from 'react';

import { FollowButton } from '~/components/follow';
import { continentName } from '~/utils/countries';

import { CountryCard } from './CountryCard';
import type { ContinentGroup } from './entries';

import classes from './Players.module.css';

const CONTINENT_SUMMARY = msg({
  message: '{nations, plural, one {# country} other {# countries}} · {count, plural, one {# entry} other {# entries}}',
  comment: 'Players tab continent summary: how many countries and entries (players or pairs) it has',
});

export const ContinentSection = memo<{
  continent: ContinentGroup;
  accordion: boolean;
  forceOpen: boolean;
  onOpen: (id: string) => void;
}>(({ continent, accordion, forceOpen, onOpen }) => {
  const { i18n } = useLingui();
  const { name: id, count, countries } = continent;
  const name = continentName(id);
  const nations = countries.length;
  return (
    <div className={classes.continent}>
      <div className={classes.continentHead}>
        <span className={classes.continentName}>{name}</span>
        <span className={classes.continentSummary}>{i18n._({ ...CONTINENT_SUMMARY, values: { nations, count } })}</span>
        <FollowButton kind="continent" id={id} name={name} variant="pill" className={classes.follow} />
      </div>
      <div className={classes.cards}>
        {countries.map((c) => (
          <CountryCard key={c.cc} country={c} accordion={accordion} forceOpen={forceOpen} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
});
