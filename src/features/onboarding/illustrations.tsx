import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { BottomFade, Glow } from '@/components/Glow';
import { colors, radius, createStyles } from '@/theme';

/** Passo 1 — carteira (Figma 25:180, slide 1). */
export function WalletIllustration() {
  return (
    <View style={wallet.box}>
      <View style={wallet.circle}>
        <Image
          source={require('../../../assets/images/onboarding/wallet.svg')}
          style={{ width: 85, height: 80 }}
          contentFit="contain"
        />
      </View>
      <Glow size={96} color={colors.primaryStrong} opacity={0.2} style={wallet.greenGlow} />
      <Glow size={64} color={colors.indigoSoft} opacity={0.8} style={wallet.indigoGlow} />
    </View>
  );
}

/** Passo 2 — anel de progresso (Figma 26:290). */
export function GoalsIllustration() {
  return (
    <View style={goals.wrap}>
      <Glow size={384} color={colors.primaryContainer} opacity={0.3} style={goals.glow} />
      <View style={goals.ring}>
        <View style={goals.rotated}>
          <Image
            source={require('../../../assets/images/onboarding/ring-track.svg')}
            style={goals.ringImage}
            contentFit="fill"
          />
          <Image
            source={require('../../../assets/images/onboarding/ring-progress.svg')}
            style={goals.ringImage}
            contentFit="fill"
          />
        </View>
        <Image
          source={require('../../../assets/images/onboarding/trend-green.svg')}
          style={{ width: 40, height: 24 }}
          contentFit="contain"
        />
      </View>
    </View>
  );
}

/** Passo 3 — gráfico de barras com cofrinho (Figma 26:241). */
export function SavingsIllustration() {
  return (
    <View style={savings.card}>
      <View style={savings.tint} />
      <View style={savings.canvas}>
        <View style={savings.trendTile}>
          <Image
            source={require('../../../assets/images/onboarding/trend-indigo.svg')}
            style={{ width: 20, height: 12 }}
            contentFit="contain"
          />
        </View>
        <View style={savings.piggy}>
          <Image
            source={require('../../../assets/images/onboarding/piggy.svg')}
            style={{ width: 20, height: 19 }}
            contentFit="contain"
          />
        </View>

        <View style={savings.bars}>
          <View style={[savings.bar, { height: 41.06, backgroundColor: colors.surfaceHighest }]}>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.outline, opacity: 0.5 }]} />
          </View>
          <View style={[savings.bar, { height: 82.13, backgroundColor: 'rgba(193,154,30,0.2)' }]}>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(193,154,30,0.4)', opacity: 0.5 }]} />
          </View>
          <View style={[savings.bar, savings.barTop]}>
            <BottomFade color={colors.primaryStrong} />
            <View style={savings.sparkle} />
          </View>
        </View>
        <View style={savings.base} />
      </View>
    </View>
  );
}

const wallet = createStyles(() => ({
  box: { width: 280, height: 280 },
  circle: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceHighest,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 10px 15px -3px rgba(15,23,42,0.08)',
  },
  greenGlow: { position: 'absolute', left: 0, bottom: 0 },
  indigoGlow: { position: 'absolute', right: 0, top: 0 },
}));

const goals = createStyles(() => ({
  wrap: { width: 192, height: 192, alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute' },
  ring: { width: 192, height: 192, alignItems: 'center', justifyContent: 'center' },
  rotated: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-90deg' }],
  },
  ringImage: { position: 'absolute', width: 168.96, height: 168.96 },
}));

const savings = createStyles(() => ({
  card: {
    width: '100%',
    maxWidth: 384,
    paddingVertical: 56,
    paddingHorizontal: 25,
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineSoft,
    borderRadius: 32,
    boxShadow: '0px 10px 15px -3px rgba(15,23,42,0.08)',
  },
  tint: { ...StyleSheet.absoluteFill, backgroundColor: colors.primaryTint },
  canvas: { width: 246.39, height: 246.39, justifyContent: 'flex-end' },
  trendTile: {
    position: 'absolute',
    top: 35.5,
    right: 35.5,
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.indigoContainer,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-12deg' }],
    boxShadow: '0px 1px 1px rgba(0,0,0,0.05)',
  },
  piggy: {
    position: 'absolute',
    top: 94,
    left: 22,
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '6deg' }],
    boxShadow: '0px 1px 1px rgba(0,0,0,0.05)',
  },
  bars: {
    height: 139.19,
    paddingTop: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  bar: {
    width: 53.59,
    overflow: 'hidden',
    borderTopLeftRadius: radius.sm,
    borderTopRightRadius: radius.sm,
  },
  barTop: {
    height: 123.19,
    backgroundColor: colors.primary,
    overflow: 'visible',
    boxShadow: '0px -4px 10px rgba(193,154,30,0.3)',
  },
  sparkle: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.gold,
    opacity: 0.7,
  },
  base: {
    height: 16,
    marginTop: 16,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceHighest,
  },
}));
