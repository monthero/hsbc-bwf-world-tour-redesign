export const BWF_ROUNDS: Readonly<Record<string, string>> = {
  'Qual. R32': 'Q-R32',
  'Qual. R16': 'Q-R16',
  'Qual. QF': 'Q-QF',
  'Qual. SF': 'Q-SF',
  'Qual. Final': 'Q-F',
  Final: 'F',
};

export const BWF_STATUSES: Readonly<Record<string, 'P' | 'F'>> = {
  F: 'F',
  O: 'F',
  P: 'P',
  C: 'P',
  W: 'P',
  H: 'P',
  S: 'P',
};
