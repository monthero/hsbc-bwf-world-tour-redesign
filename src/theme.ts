import {
  ActionIcon,
  Badge,
  Button,
  createTheme,
  defaultVariantColorsResolver,
  parseThemeColor,
  type CSSVariablesResolver,
  type VariantColorsResolver,
  type DefaultMantineColor,
  type MantineColorsTuple,
} from '@mantine/core';

import variants from '~/components/ui/variants.module.css';

const red: MantineColorsTuple = [
  '#ffe9ea',
  '#ffd9da',
  '#ffb3b5',
  '#ff8a8e',
  '#ff6b70',
  '#f0454b',
  '#e3262e',
  '#c81e25',
  '#a3171d',
  '#7c1115',
];
const dark: MantineColorsTuple = [
  '#f3f3f4',
  '#d4d4d8',
  '#a1a1a8',
  '#6f6f78',
  '#3a3a42',
  '#2e2e34',
  '#1c1c20',
  '#131315',
  '#0f0f11',
  '#0b0b0c',
];
const slate: MantineColorsTuple = [
  '#e4e4e7',
  '#8a8a92',
  '#4a4a52',
  '#34343b',
  '#2a2a30',
  '#26262b',
  '#232328',
  '#202024',
  '#1a1a1d',
  '#151517',
];
const gold: MantineColorsTuple = [
  '#fdf1d6',
  '#fbe8bc',
  '#fadfa1',
  '#f8d686',
  '#f7cd6c',
  '#f5c451',
  '#cea546',
  '#a8873a',
  '#81682f',
  '#5b4a24',
];
const green: MantineColorsTuple = [
  '#d6f4ea',
  '#bbeddc',
  '#a0e6ce',
  '#85dfc1',
  '#6ad8b3',
  '#4fd1a5',
  '#44b08c',
  '#389073',
  '#2d6f5a',
  '#224e41',
];
const blue: MantineColorsTuple = [
  '#e5eeff',
  '#d4e4ff',
  '#c3d9ff',
  '#b1ceff',
  '#a0c3ff',
  '#8fb8ff',
  '#799bd7',
  '#637faf',
  '#4e6287',
  '#384660',
];
const violet: MantineColorsTuple = [
  '#eee8ff',
  '#e3d9ff',
  '#d8caff',
  '#ccbaff',
  '#c1abff',
  '#b69cff',
  '#9a84d7',
  '#7e6caf',
  '#615487',
  '#453c60',
];
const sky: MantineColorsTuple = [
  '#ddeeff',
  '#c6e3ff',
  '#b0d8ff',
  '#99ccff',
  '#83c1ff',
  '#6cb6ff',
  '#5c9ad7',
  '#4c7eaf',
  '#3c6187',
  '#2c4560',
];
const pink: MantineColorsTuple = [
  '#ffe9f2',
  '#ffdae9',
  '#ffcbe0',
  '#ffbcd7',
  '#ffaecf',
  '#ff9fc6',
  '#d787a7',
  '#af6e89',
  '#86566a',
  '#5e3d4c',
];
const silver: MantineColorsTuple = [
  '#f6f8fb',
  '#eef0f4',
  '#e6e9ef',
  '#dfe3ea',
  '#c4c9d3',
  '#adb0b6',
  '#94979c',
  '#6f7684',
  '#626468',
  '#494a4e',
];
const bronze: MantineColorsTuple = [
  '#f8e8dc',
  '#f2d7c3',
  '#edc7aa',
  '#e8b692',
  '#e3a679',
  '#c5916a',
  '#a87b5b',
  '#8a664c',
  '#6c513d',
  '#4f3b2f',
];

const colors = { red, dark, slate, gold, green, blue, violet, sky, pink, silver, bronze };

type BwfColor = keyof typeof colors;

declare module '@mantine/core' {
  export interface MantineThemeColorsOverride {
    colors: Record<BwfColor | DefaultMantineColor, MantineColorsTuple>;
  }
}

const c = (name: BwfColor, shade: number) => `var(--mantine-color-${name}-${shade})`;
const tint = (color: string, pct: number) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;
const mix = (a: string, b: string, pct: number) => `color-mix(in srgb, ${a} ${pct}%, ${b})`;
const tourRed = '#d72630';
const OVERLAY = { backgroundOpacity: 0.62, blur: 4 };

export const MOTION_EASE = 'cubic-bezier(0.2, 0.8, 0.2, 1)';

const variantColorResolver: VariantColorsResolver = (input) => {
  if (input.variant !== 'soft' && input.variant !== 'tint') return defaultVariantColorsResolver(input);
  const parsed = parseThemeColor({ color: input.color || input.theme.primaryColor, theme: input.theme });
  const base = parsed.isThemeColor ? `var(${parsed.variable})` : parsed.value;
  if (input.variant === 'tint')
    return {
      background: tint(base, 18),
      hover: tint(base, 24),
      color: parsed.isThemeColor ? `var(--mantine-color-${parsed.color}-2)` : base,
      border: 'none',
    };
  return {
    background: tint(base, 8),
    hover: tint(base, 20),
    color: mix(c('red', 2), c('dark', 2), 25),
    hoverColor: 'var(--mantine-color-white)',
    border: `1px solid ${mix(base, c('dark', 5), 30)}`,
  };
};

export const theme = createTheme({
  primaryColor: 'red',
  primaryShade: 6,
  colors,
  white: '#ffffff',
  black: '#0b0b0c',
  fontFamily: "'Geist', system-ui, sans-serif",
  headings: { fontFamily: "'Geist', system-ui, sans-serif", fontWeight: '600' },
  defaultRadius: 'md',
  cursorType: 'pointer',
  focusRing: 'never',
  variantColorResolver,
  components: {
    ActionIcon: ActionIcon.extend({ classNames: { root: variants.root } }),
    Badge: Badge.extend({ classNames: { root: variants.root } }),
    Button: Button.extend({ classNames: { root: variants.root } }),
    Drawer: { defaultProps: { overlayProps: OVERLAY } },
    Modal: { defaultProps: { overlayProps: OVERLAY } },
    Tooltip: { defaultProps: { color: 'dark.0', c: 'dark.7', fz: 12, fw: 500, multiline: true, maw: 240 } },
  },
});

export const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: {
    '--bwf-ease': MOTION_EASE,
    '--bwf-ease-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
    '--bwf-gutter': 'clamp(16px, 3vw, 56px)',
    '--bwf-page-max': '1520px',
    '--bwf-footer-gap': '48px',
    '--bwf-card-radius': '18px',
    '--bwf-tabbar-h': '51px',
    '--bwf-header-h': '60px',
    '--bwf-brand': tourRed,
    '--bwf-brand-hi': mix(tourRed, c('dark', 9), 90),
    '--bwf-brand-deep': mix(tourRed, c('dark', 9), 62),
    '--bwf-on-brand': 'var(--mantine-color-white)',
    '--bwf-on-brand-dim': tint('var(--mantine-color-white)', 88),
    '--bwf-on-brand-faint': tint('var(--mantine-color-white)', 70),
    '--bwf-on-brand-line': tint('var(--mantine-color-white)', 20),
    '--bwf-on-brand-fill': tint('var(--mantine-color-white)', 10),
    '--bwf-on-brand-well': tint(c('dark', 9), 34),
    '--bwf-bg': c('dark', 7),
    '--bwf-bg-sunken': c('slate', 9),
    '--bwf-surface': c('slate', 8),
    '--bwf-surface-2': c('dark', 6),
    '--bwf-surface-3': c('slate', 7),
    '--bwf-surface-4': c('slate', 6),
    '--bwf-raised': c('slate', 5),
    '--bwf-line': c('slate', 6),
    '--bwf-border': c('slate', 5),
    '--bwf-border-strong': c('dark', 5),
    '--bwf-border-hover': c('dark', 4),
    '--bwf-border-focus': c('slate', 2),
    '--bwf-text': c('dark', 0),
    '--bwf-text-2': c('slate', 0),
    '--bwf-text-3': c('dark', 1),
    '--bwf-muted': c('dark', 2),
    '--bwf-dim': c('slate', 1),
    '--bwf-faint': c('dark', 3),
    '--bwf-ghost': c('slate', 2),
    '--bwf-red': c('red', 6),
    '--bwf-red-hover': c('red', 7),
    '--bwf-red-text': c('red', 4),
    '--bwf-red-soft': c('red', 3),
    '--bwf-red-pale': c('red', 1),
    '--bwf-red-tint': tint(c('red', 6), 16),
    '--bwf-red-edge': tint(c('red', 4), 70),
    '--bwf-spot-glow': `0 0 10px 1px ${tint(c('red', 6), 55)}`,
    '--bwf-gold': c('gold', 5),
    '--bwf-gold-text': c('gold', 4),
    '--bwf-gold-tint': tint(c('gold', 5), 12),
    '--bwf-gold-edge': tint(c('gold', 5), 50),
    '--bwf-win-bg': tint(c('green', 5), 11),
    '--bwf-loss-bg': tint(c('red', 4), 9),
    '--bwf-glass-bg': tint(c('dark', 7), 90),
    '--bwf-sep': `color-mix(in srgb, ${c('dark', 3)}, ${c('slate', 2)})`,
    '--bwf-green': c('green', 5),
    '--bwf-blue': c('blue', 5),
    '--bwf-silver': c('silver', 3),
    '--bwf-silver-text': c('silver', 2),
    '--bwf-bronze': c('bronze', 4),
    '--bwf-bronze-text': c('bronze', 3),
    '--bwf-lv-1000': c('violet', 5),
    '--bwf-lv-750': c('sky', 5),
    '--bwf-lv-500': c('green', 5),
    '--bwf-lv-300': c('pink', 5),
    '--bwf-lv-finals': c('gold', 5),
  },
  light: {},
  dark: {
    '--mantine-color-body': 'var(--bwf-bg)',
    '--mantine-color-text': 'var(--bwf-text)',
    '--mantine-color-default-border': 'var(--bwf-border-strong)',
    '--mantine-color-dimmed': 'var(--bwf-muted)',
  },
});
