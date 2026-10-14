import type { CSSProperties } from 'react';

const LINE_SPECS: readonly (readonly [string, 'h' | 'v', string, string?, string?])[] = [
  ['back-far', 'h', '0%'],
  ['long-far', 'h', 'var(--ay)'],
  ['short-far', 'h', 'calc(50% - var(--front))'],
  ['short-near', 'h', 'calc(50% + var(--front))'],
  ['long-near', 'h', 'calc(100% - var(--ay))'],
  ['back-near', 'h', '100%'],
  ['side-left', 'v', '0%'],
  ['single-left', 'v', 'var(--ax)'],
  ['centre-far', 'v', '50%', '0%', 'calc(50% + var(--front))'],
  ['centre-near', 'v', '50%', 'calc(50% + var(--front))', '0%'],
  ['single-right', 'v', 'calc(100% - var(--ax))'],
  ['side-right', 'v', '100%'],
];

export const COURT_LINES = LINE_SPECS.map(([id, dir, at, from = '0%', to = '0%'], i) => ({
  id,
  dir,
  style: { '--at': at, '--from': from, '--to': to, '--i': i } as CSSProperties,
}));
