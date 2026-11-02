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

const ENTRIES = msg({
  message: '{count, plural, one {# entry} other {# entries}}',
  comment: 'Players tab section summary: number of entries (players or pairs)',
});

const ACROSS_CONTINENTS = msg({
  message: 'Across continents',
  comment:
    'Players tab section title, shown in place of a continent name: doubles pairs whose two players come from different continents',
});

export const ContinentSection = memo<{
  continent: ContinentGroup;
  accordion: boolean;
  forceOpen: boolean;
  onOpen: (id: string) => void;
}>(({ continent, accordion, forceOpen, onOpen }) => {
  const { i18n } = useLingui();
  const { continent: id, count, nations, countries } = continent;
  const name = id ? continentName(id) : i18n._(ACROSS_CONTINENTS);
  return (
    <div className={classes.continent}>
      <div className={classes.continentHead}>
        <span className={classes.continentName}>{name}</span>
        <span className={classes.continentSummary}>
          {i18n._({ ...(id ? CONTINENT_SUMMARY : ENTRIES), values: { nations, count } })}
        </span>
        {id && <FollowButton kind="continent" id={id} name={name} variant="pill" className={classes.follow} />}
      </div>
      <div className={classes.cards}>
        {countries.map((c) => (
          <CountryCard key={c.key} country={c} accordion={accordion} forceOpen={forceOpen} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
});
