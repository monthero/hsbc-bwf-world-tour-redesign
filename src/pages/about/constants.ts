import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';

import type { Level } from '~/types';

import type { SeasonStatus } from './types';

export const ABOUT_KICKER = msg({
  message: 'About the Tour',
  comment: 'Small label above the heading of the page explaining how the HSBC BWF World Tour works',
});
export const ABOUT_TITLE = 'HSBC BWF World Tour';
export const ABOUT_META = msg({
  message:
    'A season-long circuit of the world’s best in singles and doubles, building to the World Tour Finals in December',
  comment:
    'Intro under the About page heading while season data loads. The World Tour Finals is the season-ending event for the top 8 per discipline',
});

export const ABOUT_SECTIONS = {
  tiers: msg({
    message: 'How the Tour works',
    comment:
      'About page section heading explaining the tournament levels (Super 1000, 750, 500, 300) and ranking points',
  }),
  race: msg({
    message: 'Race to the Finals',
    comment:
      'About page section heading for the “Race to Finals” standings: a season-long points table whose top 8 per discipline qualify for the World Tour Finals',
  }),
} as const;

export const SPOTLIGHT = ['next', 'finale', 'titles'] as const;

export const MAP_SIZE = { w: 1000, h: 401 } as const;
export const PIN_GAP_PX = { desktop: 17, mobile: 10 } as const;
export const WIDTH_STEP = 40;
export const MAP_ZOOM = { max: 8, step: 2, homeMax: 6 } as const;
export const HOME_FRAME = { radius: 100, minSpan: 180, pad: 1.3 } as const;
export const LAND_FINE_PPU = 2.5;
export const LAND_BORDER_PX = 0.75;
export const LAND_OVERSCAN = 0.5;
export const LAND_MAX_DPR = 2;
export const REVEAL_INSET = { desktop: 0.1, mobile: 0.5 } as const;
export const WHEEL_HINT_MS = 1400;
export const RELAX = { iterations: 48, spring: 0.04, angle: 2.39996, leader: 0.25 } as const;
export const FLIP_AT = 0.62;
export const ROUTE_ARC = { bend: 0.18, spread: 0.14, near: 12 } as const;
export const ROUTE_ARROW = { span: 9, room: 3 } as const;

export const KICKERS = {
  next: msg({
    message: 'Next stop',
    comment: 'Small label above a tournament on the About page season map: the next tournament on the World Tour',
  }),
  live: msg({
    message: 'Live now',
    comment: 'Small label above a tournament that is being played right now',
  }),
  finals: msg({
    message: 'Finals',
    context: 'tournament',
    comment: 'Small label above the World Tour Finals, the season-ending tournament, on the About page season map',
  }),
  done: msg({
    message: 'Completed',
    comment: 'Small label above a tournament that has finished, on the About page season map',
  }),
  cancelled: msg({
    message: 'Cancelled',
    comment: 'Small label or status for a tournament that was cancelled',
  }),
} as const;

export const CLOSE_DELAY = 160;

export const SHORT_MONTH = { month: 'short' } as const;

export const LONG_MONTH = { month: 'long' } as const;

export const LEGEND_LEVELS = ['1000', '750', '500', '300', 'Finals'] as const satisfies readonly Level[];

export const STATUS_META: Record<SeasonStatus, { label: MessageDescriptor; color: string }> = {
  done: {
    label: msg({
      message: 'Completed',
      context: 'filter',
      comment: 'About page season map legend and filter: tournaments that have finished',
    }),
    color: 'var(--bwf-text-3)',
  },
  up: {
    label: msg({
      message: 'Upcoming',
      comment: 'About page season map legend and filter: tournaments still to be played',
    }),
    color: 'var(--bwf-text)',
  },
  next: {
    label: msg({
      message: 'Live / next',
      comment: 'About page season map legend and filter: the tournament being played now, or the next one to start',
    }),
    color: 'var(--bwf-red-text)',
  },
};

export const TIER_LEVELS = ['Finals', '1000', '750', '500', '300'] as const;

export const TITLES_TOP_N = 5;

export const PRIZE_TBC = msg({
  message: 'Prize TBC',
  comment: 'About page tier ladder: prize money for this tournament level is not announced yet (to be confirmed)',
});

export const UP_NEXT = msg({
  message: 'Up next',
  context: 'tournament',
  comment: 'Small label above the next World Tour tournament still to be played, on the About page',
});

export const NEXT_SEASON = msg({
  message: 'Next season',
  comment:
    'Small label above the opening tournament of next year’s World Tour, shown once this season has no events left',
});

export const TITLES_HEADING = {
  running: msg({
    message: 'Titles so far',
    comment: 'About page card heading: titles won by each country in this season’s tournaments played so far',
  }),
  complete: msg({
    message: 'Season titles',
    comment: 'About page card heading once the season is over: titles won by each country across the season',
  }),
} as const;

export const PATHWAY_NOTE = msg({
  message: 'The pathway into the Tour. Ranking points, but not part of the World Tour.',
  comment:
    'Note on the Super 100 tier in the About page ladder: lower-level events that award world ranking points but are not World Tour events',
});

export const RACE_LINE = msg({
  message: 'Qualification line',
  comment: 'Divider in the Race to Finals standings: players above it currently qualify for the World Tour Finals',
});

export const FINALS_CHAMPIONS = msg({
  message: 'Finals champions',
  comment: 'About page section heading: the winners of each discipline at this season’s World Tour Finals',
});

export const FINALS_RESULTS = msg({
  message: 'Finals results',
  comment: 'Link to the full results (podium) of this season’s World Tour Finals',
});
