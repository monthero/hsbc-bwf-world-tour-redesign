import { msg } from '@lingui/core/macro';
import { use, useMemo } from 'react';

import { SEASON_YEAR } from '~/constants';
import { TournamentRankContext } from '~/contexts';
import { useCareerIndex } from '~/hooks/useCareer';
import { usePlayerDirectory, useRaceRankings } from '~/hooks/usePlayers';
import { useSeasonIndex } from '~/hooks/useSeason';
import type { Match, Tournament } from '~/types';
import { careerRecord, meetingsVs, teamHistory } from '~/utils/h2h';
import { raceRank, worldRank } from '~/utils/rankings';
import { recentForm, winLoss } from '~/utils/season';

import { formItems, rankRow, toMeetings, wlRow, type CompareRow } from './utils';

const SEASON_WL = msg({
  message: `${SEASON_YEAR} W–L`,
  comment: 'Head-to-head row: win–loss record this season; {SEASON_YEAR} is the year',
});
const CAREER_WL = msg({
  message: 'World Tour W–L',
  comment: 'Head-to-head row: career win–loss record on the World Tour',
});
const WORLD_RANKING = msg({ message: 'World ranking', comment: 'Head-to-head row: each side’s BWF world ranking' });
const RACE = msg({
  message: 'Race to Finals',
  comment: 'Head-to-head row: standing in the season race to qualify for the World Tour Finals',
});
const FORM_LIMIT = 5;

export const useMatchInsights = (match: Match, tournament: Tournament) => {
  const { data: dir } = usePlayerDirectory();
  const rankOf = use(TournamentRankContext);
  const { data: race } = useRaceRankings();
  const index = useSeasonIndex();
  const [a, b] = match.teams;
  const ev = match.event;
  const leadIds = useMemo(
    () => [a.players[0]?.id, b.players[0]?.id].filter((id): id is string => !!id),
    [a.players, b.players],
  );
  const career = useCareerIndex(leadIds);

  const record = useMemo(
    () => (career ? careerRecord(career, match, tournament.code) : null),
    [career, match, tournament.code],
  );

  const history = useMemo(() => {
    const listA = teamHistory(index, match, 0);
    const listB = teamHistory(index, match, 1);
    return {
      ready: !!index,
      wlA: winLoss(listA),
      wlB: winLoss(listB),
      formA: formItems(recentForm(listA, FORM_LIMIT)),
      formB: formItems(recentForm(listB, FORM_LIMIT)),
      meets: toMeetings(meetingsVs(listA, match, tournament.code), false),
    };
  }, [index, match, tournament.code]);

  const allMeets = useMemo(() => (record ? toMeetings(record.meets, true) : []), [record]);

  const compare = useMemo(() => {
    const rows: CompareRow[] = [
      rankRow(
        'wr',
        WORLD_RANKING,
        rankOf ? rankOf(a.players, ev) : worldRank(dir, a.players, ev),
        rankOf ? rankOf(b.players, ev) : worldRank(dir, b.players, ev),
      ),
      rankRow('race', RACE, raceRank(race, a.players, ev), raceRank(race, b.players, ev)),
    ];
    if (record) rows.push(wlRow('career', CAREER_WL, record.careerA, record.careerB));
    rows.push(wlRow('season', SEASON_WL, history.wlA, history.wlB));
    return rows;
  }, [dir, rankOf, race, a, b, ev, record, history.wlA, history.wlB]);

  return { record, history, allMeets, compare };
};
