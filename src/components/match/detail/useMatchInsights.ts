import { useMemo } from 'react';

import { SEASON_YEAR } from '~/constants';
import { useCareerIndex } from '~/hooks/useCareer';
import { usePlayerDirectory, useRaceRankings } from '~/hooks/usePlayers';
import { useSeasonIndex } from '~/hooks/useSeason';
import type { Match, Tournament } from '~/types';
import { careerRecord, meetingsVs, teamHistory } from '~/utils/h2h';
import { raceRank, worldRank } from '~/utils/rankings';
import { recentForm, winLoss } from '~/utils/season';

import { formItems, rankRow, toMeetings, wlRow, type CompareRow } from './utils';

const SEASON_WL = `${SEASON_YEAR} W–L`;
const FORM_LIMIT = 5;

export const useMatchInsights = (match: Match, tournament: Tournament) => {
  const { data: dir } = usePlayerDirectory();
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
      rankRow('wr', 'World ranking', worldRank(dir, a.players, ev), worldRank(dir, b.players, ev)),
      rankRow('race', 'Race to Finals', raceRank(race, a.players, ev), raceRank(race, b.players, ev)),
    ];
    if (record) rows.push(wlRow('career', 'World Tour W–L', record.careerA, record.careerB));
    rows.push(wlRow('season', SEASON_WL, history.wlA, history.wlB));
    return rows;
  }, [dir, race, a, b, ev, record, history.wlA, history.wlB]);

  return { record, history, allMeets, compare };
};
