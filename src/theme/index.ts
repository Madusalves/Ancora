// Design tokens extraídos do Figma FINORA (node 43:2 – Nova Transação).
export const colors = {
  background: '#f7f9fb',
  surface: '#ffffff',
  surfaceLow: '#f2f4f6',
  surfaceHigh: '#eceef0',
  surfaceHighest: '#e0e3e5',

  text: '#191c1e',
  textMuted: '#3d4a42',
  textSubtle: '#6d7a72',
  textSecondary: '#565e74',
  placeholder: '#6b7280',

  primary: '#006948',
  primaryStrong: '#00855d',
  primaryContainer: '#85f8c4',
  primaryTint: 'rgba(0,105,72,0.05)',
  primaryContainerTint: 'rgba(133,248,196,0.2)',

  error: '#ba1a1a',
  errorSoft: '#ffdad6',
  warning: '#b45309',
  warningSoft: '#fef3c7',
  dot: '#e0e3e5',
  indigoContainer: '#e1e0ff',
  indigoSoft: '#dae2fd',

  outline: '#bccac0',
  outlineSoft: 'rgba(188,202,192,0.3)',
  outlineMedium: 'rgba(188,202,192,0.6)',
  switchBorder: '#d1d5db',
  onPrimary: '#ffffff',
} as const;

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
