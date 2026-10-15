import { memo } from 'react';

import { FollowButton } from '~/components/follow';
import { plural } from '~/utils/format';

import { CountryCard } from './CountryCard';
import type { ContinentGroup } from './entries';

import classes from './Players.module.css';

export const ContinentSection = memo<{
  continent: ContinentGroup;
  accordion: boolean;
  forceOpen: boolean;
  onOpen: (id: string) => void;
}>(({ continent, accordion, forceOpen, onOpen }) => {
  const { name, count, countries } = continent;
  return (
    <div className={classes.continent}>
      <div className={classes.continentHead}>
        <span className={classes.continentName}>{name}</span>
        <span className={classes.continentSummary}>
          {plural(countries.length, 'country', 'countries')} · {plural(count, 'entry', 'entries')}
        </span>
        <FollowButton kind="continent" id={name} name={name} variant="pill" className={classes.follow} />
      </div>
      <div className={classes.cards}>
        {countries.map((c) => (
          <CountryCard key={c.cc} country={c} accordion={accordion} forceOpen={forceOpen} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
});
