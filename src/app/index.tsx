import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Glow } from '@/components/Glow';
import { hasSeenOnboarding } from '@/features/onboarding/storage';
import { t } from '@/i18n/pt-BR';
import { supabase } from '@/lib/supabase';
import { colors, fonts } from '@/theme';

const SPLASH_MS = 1800;

/** Splash (Figma 25:4). Depois decide entre o wizard e o login. */
export default function Splash() {
  const router = useRouter();

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      const seen = await hasSeenOnboarding();
      if (!active) return;
      if (data.session) router.replace('/home');
      else router.replace(seen ? '/login' : '/onboarding');
    }, SPLASH_MS);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [router]);

  return (
    <View style={styles.screen}>
      <Glow size={468} color={colors.primaryContainer} opacity={0.35} style={styles.glow} />

      <View style={styles.center}>
        <View style={styles.logoBox}>
          <Image
            source={require('../../assets/images/finora-logo.png')}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            accessibilityLabel={t.brand}
          />
        </View>
        <Text style={styles.brand}>{t.brand}</Text>
      </View>

      <Text style={styles.tagline}>{t.splash.tagline}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute' },
  center: { alignItems: 'center' },
  logoBox: {
    width: 160,
    height: 160,
    padding: 1,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceHighest,
    borderRadius: 24,
    boxShadow: '0px 10px 20px -10px rgba(0,0,0,0.05)',
    marginBottom: 24,
  },
  brand: {
    fontFamily: fonts.displayBold,
    fontSize: 40,
    lineHeight: 48,
    letterSpacing: -1,
    color: colors.text,
  },
  tagline: {
    position: 'absolute',
    bottom: 48,
    left: 24,
    right: 24,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.4,
    color: colors.textSecondary,
  },
});
