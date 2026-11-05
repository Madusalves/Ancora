import { StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';

// Identidade Âncora: preto e dourado (do logo). Layout herdado do Figma FINORA (node 43:2).
// Receitas em verde, despesas em vermelho discreto, investimentos/marca em dourado.

const dark = {
  background: '#0c0c0d',
  surface: '#161617',
  surfaceLow: '#111112',
  surfaceHigh: '#1f1f21',
  surfaceHighest: '#2a2a2d',

  text: '#f2efe6',
  textMuted: '#b3aea0',
  textSubtle: '#857f72',
  textSecondary: '#9d978a',
  placeholder: '#6f6a5f',

  primary: '#e0c050',
  primaryStrong: '#ecd067',
  primaryContainer: 'rgba(224,192,80,0.2)',
  primaryTint: 'rgba(224,192,80,0.08)',
  primaryContainerTint: 'rgba(224,192,80,0.16)',

  gold: '#e0c050',
  goldSoft: 'rgba(224,192,80,0.14)',
  highlight: '#e0c050',

  income: '#5fd38d',
  incomeSoft: 'rgba(95,211,141,0.14)',
  expense: '#e0675f',
  expenseSoft: 'rgba(224,103,95,0.14)',

  error: '#e0675f',
  errorSoft: 'rgba(224,103,95,0.14)',
  warning: '#e8a23c',
  warningSoft: 'rgba(232,162,60,0.14)',
  dot: '#2a2a2d',
  indigoContainer: 'rgba(224,192,80,0.14)',
  indigoSoft: 'rgba(224,192,80,0.3)',

  outline: '#2c2c2f',
  outlineSoft: 'rgba(255,255,255,0.06)',
  outlineMedium: 'rgba(255,255,255,0.12)',
  switchBorder: '#3d3d41',
  onPrimary: '#14110a',

  // Fundos sobrepostos (barras fixas, vidro) e cortina de modais
  scrim: 'rgba(12,12,13,0.92)',
  scrimStrong: 'rgba(12,12,13,0.96)',
  glass: 'rgba(22,22,23,0.85)',
  backdrop: 'rgba(0,0,0,0.6)',
};

export type Palette = { [K in keyof typeof dark]: string };

const light: Palette = {
  background: '#faf8f2',
  surface: '#ffffff',
  surfaceLow: '#f4f1e8',
  surfaceHigh: '#ece8dc',
  surfaceHighest: '#e1dccd',

  text: '#1a1710',
  textMuted: '#4d483a',
  textSubtle: '#756f5d',
  textSecondary: '#5f5a4b',
  placeholder: '#8a8473',

  primary: '#a67c00',
  primaryStrong: '#b58900',
  primaryContainer: 'rgba(193,154,30,0.2)',
  primaryTint: 'rgba(166,124,0,0.07)',
  primaryContainerTint: 'rgba(193,154,30,0.16)',

  gold: '#c19a1e',
  goldSoft: 'rgba(193,154,30,0.16)',
  highlight: '#ecd06a',

  income: '#1f8a4c',
  incomeSoft: 'rgba(31,138,76,0.12)',
  expense: '#c0443d',
  expenseSoft: 'rgba(192,68,61,0.1)',

  error: '#c0443d',
  errorSoft: 'rgba(192,68,61,0.1)',
  warning: '#b45f06',
  warningSoft: 'rgba(180,95,6,0.12)',
  dot: '#e1dccd',
  indigoContainer: 'rgba(193,154,30,0.16)',
  indigoSoft: 'rgba(193,154,30,0.3)',

  outline: '#d8d2c0',
  outlineSoft: 'rgba(26,23,16,0.08)',
  outlineMedium: 'rgba(26,23,16,0.16)',
  switchBorder: '#cfc8b4',
  onPrimary: '#1a1710',

  scrim: 'rgba(250,248,242,0.92)',
  scrimStrong: 'rgba(250,248,242,0.96)',
  glass: 'rgba(255,255,255,0.85)',
  backdrop: 'rgba(26,23,16,0.45)',
};

export type Scheme = 'light' | 'dark';
const palettes: Record<Scheme, Palette> = { dark, light };

// O app abre no escuro; o ThemeProvider troca para o claro se o usuário tiver escolhido.
let scheme: Scheme = 'dark';

export const getScheme = (): Scheme => scheme;
export function setScheme(next: Scheme) {
  scheme = next;
}

/**
 * Cores do tema atual. Lê o esquema na hora do acesso, então use sempre `colors.x`
 * (nunca copie o valor para uma constante fora de componente/estilo).
 */
export const colors: Palette = new Proxy({} as Palette, {
  get: (_, key: string) => palettes[scheme][key as keyof Palette],
  ownKeys: () => Object.keys(dark),
  getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true }),
});

/**
 * `StyleSheet.create` que respeita o tema: a fábrica roda de novo quando o esquema muda.
 * A árvore é remontada na troca de tema (ver ThemeBoundary), então os estilos são relidos.
 */
export function createStyles<T extends Record<string, ViewStyle | TextStyle | ImageStyle>>(factory: () => T): T {
  const cache: Partial<Record<Scheme, T>> = {};
  return new Proxy({} as T, {
    get: (_, key) => {
      const sheet = (cache[scheme] ??= StyleSheet.create(factory()));
      return (sheet as Record<PropertyKey, unknown>)[key];
    },
  });
}

export const fonts = {
  displayBold: 'HankenGrotesk_700Bold',
  displaySemiBold: 'HankenGrotesk_600SemiBold',
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
} as const;

export const radius = { sm: 8, md: 12, pill: 9999 } as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;

// Escala tipográfica (size / lineHeight / letterSpacing em px)
export const typography = {
  title: { fontFamily: fonts.displayBold, fontSize: 24, lineHeight: 32, letterSpacing: -0.6 },
  amount: { fontFamily: fonts.displayBold, fontSize: 40, lineHeight: 48, letterSpacing: -1 },
  amountCurrency: { fontFamily: fonts.displaySemiBold, fontSize: 24, lineHeight: 32, letterSpacing: -0.24 },
  body: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  bodyStrong: { fontFamily: fonts.semiBold, fontSize: 14, lineHeight: 20 },
  button: { fontFamily: fonts.semiBold, fontSize: 16, lineHeight: 24 },
  label: { fontFamily: fonts.semiBold, fontSize: 12, lineHeight: 16, letterSpacing: 0.6 },
  caption: { fontFamily: fonts.medium, fontSize: 11, lineHeight: 14, letterSpacing: 0.22 },
} as const;

export const theme = { colors, fonts, radius, spacing, typography };
export type Theme = typeof theme;
