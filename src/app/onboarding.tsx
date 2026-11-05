import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { PageDots } from '@/components/PageDots';
import {
  GoalsIllustration,
  SavingsIllustration,
  WalletIllustration,
} from '@/features/onboarding/illustrations';
import { markOnboardingSeen } from '@/features/onboarding/storage';
import { t } from '@/i18n/pt-BR';
import { colors, fonts } from '@/theme';

const arrow12 = require('../../assets/icons/arrow-right-12.svg');
const arrow9 = require('../../assets/icons/arrow-right-9.svg');

const ILLUSTRATIONS = [WalletIllustration, GoalsIllustration, SavingsIllustration];

/** Wizard de boas-vindas (Figma 25:180 → 26:290 → 26:241), em PT-BR. */
export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const steps = t.onboarding.steps;
  const last = steps.length - 1;
  const Illustration = ILLUSTRATIONS[step];
  const hero = step === 1;

  const finish = async () => {
    await markOnboardingSeen();
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.screen}>
      {step === 0 ? <Text style={styles.brand}>{t.brand}</Text> : null}

      <View style={styles.main}>
        <View style={styles.illustration}>
          <Illustration />
        </View>

        <View style={styles.texts}>
          <Text style={[styles.title, hero && styles.titleHero]}>{steps[step].title}</Text>
          <Text style={[styles.body, hero && styles.bodyHero]}>{steps[step].body}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <PageDots count={steps.length} index={step} />

        <View style={[styles.actions, step === 0 && styles.actionsBetween]}>
          {step === 0 ? (
            <Button label={t.onboarding.skip} variant="ghost" onPress={finish} />
          ) : (
            <Button
              label={t.onboarding.back}
              variant="outline"
              onPress={() => setStep(step - 1)}
              style={{ flex: 1 }}
            />
          )}

          {step === last ? (
            <Button
              label={t.onboarding.start}
              icon={arrow9}
              iconSize={{ width: 9.33, height: 9.33 }}
              onPress={finish}
              style={{ flex: 2 }}
            />
          ) : (
            <Button
              label={t.onboarding.next}
              icon={step === 0 ? arrow12 : undefined}
              iconSize={step === 0 ? { width: 12, height: 12 } : undefined}
              onPress={() => setStep(step + 1)}
              style={step === 0 ? { paddingHorizontal: 32 } : { flex: 1 }}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  brand: {
    position: 'absolute',
    top: 24,
    left: 16,
    fontFamily: fonts.displayBold,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.24,
    color: colors.primary,
  },
  main: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  illustration: { alignItems: 'center', justifyContent: 'center', marginBottom: 32, alignSelf: 'stretch' },
  texts: { maxWidth: 384, gap: 8, alignItems: 'center' },
  title: {
    textAlign: 'center',
    fontFamily: fonts.displaySemiBold,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.28,
    color: colors.text,
  },
  titleHero: {
    fontFamily: fonts.displayBold,
    fontSize: 40,
    lineHeight: 48,
    letterSpacing: -0.8,
  },
  body: {
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: colors.textMuted,
  },
  bodyHero: { fontSize: 18, lineHeight: 28 },
  footer: { alignItems: 'center', gap: 32, paddingHorizontal: 16, paddingTop: 24, paddingBottom: 16 },
  actions: { flexDirection: 'row', gap: 16, width: '100%', maxWidth: 384 },
  actionsBetween: { justifyContent: 'space-between' },
});
