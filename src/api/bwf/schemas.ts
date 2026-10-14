import { z } from 'zod';

const Idish = z.union([z.string(), z.number()]);

const BwfPlayer = z.object({
  id: Idish.transform(String),
  nameDisplay: z.string(),
  countryCode: z.string().nullish(),
});

const BwfTeam = z.object({ players: z.array(BwfPlayer) });

const BwfScore = z.object({
  home: z.number(),
  away: z.number(),
  serve: Idish.nullish(),
  lastPointWinner: z.number().nullish(),
});

export const BwfMatch = z.object({
  code: z.string().nullish(),
  matchStatusValue: z.string().nullish(),
  isTeamMatch: z.boolean().nullish(),
  matchStatus: z.string(),
  scoreStatus: z.number().nullish(),
  scoreStatusValue: z.string().nullish(),
  winner: z.number().nullish(),
  team1: BwfTeam.nullish(),
  team2: BwfTeam.nullish(),
  team1seed: Idish.nullish(),
  team2seed: Idish.nullish(),
  matchTime: z.string().nullish(),
  matchTimeUtc: z.string().nullish(),
  eventName: z.string(),
  roundName: z.string(),
  courtCode: z.string().nullish(),
  courtIndex: z.number().nullish(),
  duration: z.number().nullish(),
  score: z.array(BwfScore).nullish(),
});
export type BwfMatch = z.infer<typeof BwfMatch>;

export const BwfDayMatches = z.array(z.unknown()).transform((items) =>
  items.flatMap((item) => {
    const parsed = BwfMatch.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  }),
);
export type BwfDayMatches = z.infer<typeof BwfDayMatches>;

const BwfOption = z.object({ value: Idish.transform(String), text: z.string() });

export const BwfOptions = z.object({ results: z.array(BwfOption).nullable() });
export type BwfOptions = z.infer<typeof BwfOptions>;

export const BwfDraws = z.object({ results: z.array(BwfOption.extend({ type: z.number() })).nullable() });
export type BwfDraws = z.infer<typeof BwfDraws>;

export const BwfDrawData = z.object({
  results: z.record(z.string(), z.object({ match: BwfMatch })).nullish(),
});
export type BwfDrawData = z.infer<typeof BwfDrawData>;

const BwfEntrant = z.object({ id: Idish.transform(String), name_display: z.string() });

export const BwfEntry = z.object({
  type_id: z.number(),
  seed: Idish.nullish(),
  qseed: Idish.nullish(),
  rank: z.number().nullish(),
  player1_country: z.string().nullish(),
  player2_country: z.string().nullish(),
  player1_model: BwfEntrant.nullish(),
  player2_model: BwfEntrant.nullish(),
});
export type BwfEntry = z.infer<typeof BwfEntry>;

export const BwfEntries = z.object({ results: z.array(BwfEntry).nullable() });
export type BwfEntries = z.infer<typeof BwfEntries>;

const Count = z
  .number()
  .nullish()
  .transform((n) => n ?? 0);

export const BwfMatchStat = z.object({
  results: z
    .object({
      team1_consecutive_points: Count,
      team2_consecutive_points: Count,
      team1_rallies_won: Count,
      team2_rallies_won: Count,
      team1_challenge_used: Count,
      team2_challenge_used: Count,
      team1_challenge_won: Count,
      team2_challenge_won: Count,
      team1_challenge_lost: Count,
      team2_challenge_lost: Count,
    })
    .nullable(),
});
export type BwfMatchStat = z.infer<typeof BwfMatchStat>;

const PlayerId = Idish.nullish().transform((id) => (id ? String(id) : null));

export const BwfLiveMatches = z.object({
  results: z
    .array(
      z.object({
        live_detail: z.object({ service_player: z.number().nullish() }).nullish(),
        match_detail: z
          .object({
            code: Idish.transform(String),
            team1_player1_id: PlayerId,
            team1_player2_id: PlayerId,
            team2_player1_id: PlayerId,
            team2_player2_id: PlayerId,
          })
          .nullish(),
      }),
    )
    .nullish(),
});
export type BwfLiveMatches = z.infer<typeof BwfLiveMatches>;
